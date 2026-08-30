import { appendTurn, updateSessionStatus, getTurns } from '../db/sessions';
import { getCatalogItem, getMandate, updateMandateSpend, updateDiscountUsed } from '../db/catalog';
import { proposeBuyerMove } from '../agents/buyerAgent';
import { proposeMerchantMove } from '../agents/merchantAgent';
import { BuyerMove, MerchantMove } from '../agents/schema';
import { checkMandate } from '../gates/mandateGate';
import { checkPolicy } from '../gates/policyGate';
import { executeDeal } from '../executor/dealExecutor';

const MAX_TURNS = 10;

function formatHistory(turns: any[]): string {
  if (turns.length === 0) return '(no turns yet)';
  return turns
    .map((t) => `Turn ${t.turn_number} (${t.actor}): ${JSON.stringify(t.proposed_move)} [${t.policy_result}]`)
    .join('\n');
}

export async function runNegotiation(sessionId: string, catalogItemId: string, mandateId: string) {
  let turn = 0;
  let converged = false;
  let currentOffer: { unit_price: number; quantity: number } | null = null;

  while (turn < MAX_TURNS) {
    const catalogItem = await getCatalogItem(catalogItemId);
    const mandate = await getMandate(mandateId);
    const pastTurns = await getTurns(sessionId);
    const history = formatHistory(pastTurns);

    // ---- BUYER TURN ----
    turn++;
    const buyerRaw = await proposeBuyerMove({
      maxUnitPrice: Number(mandate.max_unit_price),
      remainingSpend: Number(mandate.max_total_spend) - Number(mandate.spend_used),
      turnHistory: history,
      currentOffer,
    });

    const mandateCheck = checkMandate(
      {
        type: buyerRaw.type,
        unit_price: buyerRaw.unit_price,
        quantity: buyerRaw.quantity,
        total: buyerRaw.total,
      },
      {
        max_total_spend: Number(mandate.max_total_spend),
        spend_used: Number(mandate.spend_used),
        max_unit_price: Number(mandate.max_unit_price),
        category_allowlist: mandate.category_allowlist,
        expires_at: mandate.expires_at,
      }
    );

    let buyerFinalMove: BuyerMove = buyerRaw;
    let buyerPolicyResult: 'pass' | 'blocked' | 'adjusted' = 'pass';
    let buyerReason = 'within mandate';

    if (mandateCheck.result === 'blocked') {
      buyerPolicyResult = 'blocked';
      buyerReason = mandateCheck.reason;
      await appendTurn(sessionId, 'buyer', buyerRaw, buyerPolicyResult, buyerReason);
      await updateSessionStatus(sessionId, 'failed');
      return { converged: false, turnsUsed: turn, reason: mandateCheck.reason };
    } else if (mandateCheck.result === 'adjusted') {
      buyerPolicyResult = 'adjusted';
      buyerReason = mandateCheck.reason;
      buyerFinalMove = {
        ...buyerRaw,
        quantity: mandateCheck.adjustedQuantity,
        total: (buyerRaw.unit_price ?? 0) * mandateCheck.adjustedQuantity,
      };
    }

    await appendTurn(sessionId, 'buyer', buyerFinalMove, buyerPolicyResult, buyerReason);

    const buyerType = buyerFinalMove.type;
    const buyerUnitPrice: number | null = buyerFinalMove.unit_price;
    const buyerQuantity: number = buyerFinalMove.quantity;

    if (buyerType === 'accept') {
      converged = true;
      console.log('[orchestrator] buyer accepted, currentOffer:', currentOffer);
      if (currentOffer) {
        try {
          const execResult = await executeDeal(sessionId, catalogItemId, mandateId, {
            unit_price: currentOffer.unit_price,
            quantity: currentOffer.quantity,
            total: currentOffer.unit_price * currentOffer.quantity,
          });
          console.log('[orchestrator] executeDeal result:', execResult);
          if (!execResult.blocked) {
            await updateMandateSpend(mandateId, currentOffer.unit_price * currentOffer.quantity);
          }
        } catch (err) {
          console.error('[orchestrator] executeDeal threw an error:', err);
        }
      } else {
        console.log('[orchestrator] currentOffer was null, executeDeal NOT called');
      }
      break;
    }
        if (buyerType === 'walk_away') {
      await updateSessionStatus(sessionId, 'failed');
      return { converged: false, turnsUsed: turn, reason: 'Buyer walked away' };
    }

    const prevOfferPrice: number = currentOffer ? currentOffer.unit_price : 0;
    currentOffer = { unit_price: buyerUnitPrice ?? prevOfferPrice, quantity: buyerQuantity };
    if (turn >= MAX_TURNS) break;
    // ---- MERCHANT TURN ----
    turn++;
    const merchantRaw = await proposeMerchantMove({
      floorPrice: Number(catalogItem.floor_price),
      basePrice: Number(catalogItem.base_price),
      turnHistory: formatHistory(await getTurns(sessionId)),
      currentOffer,
    });

    const policyCheck = checkPolicy(
      { type: merchantRaw.type, unit_price: merchantRaw.unit_price, quantity: merchantRaw.quantity },
      {
        floor_price: Number(catalogItem.floor_price),
        base_price: Number(catalogItem.base_price),
        inventory_qty: catalogItem.inventory_qty,
        daily_discount_budget: Number(catalogItem.daily_discount_budget),
        discount_used_today: Number(catalogItem.discount_used_today),
      }
    );

    let merchantFinalMove: MerchantMove = merchantRaw;
    let merchantPolicyResult: 'pass' | 'blocked' | 'adjusted' = 'pass';
    let merchantReason = 'within policy';

    if (policyCheck.result === 'blocked') {
      merchantPolicyResult = 'blocked';
      merchantReason = policyCheck.reason;
      await appendTurn(sessionId, 'merchant', merchantRaw, merchantPolicyResult, merchantReason);
      await updateSessionStatus(sessionId, 'failed');
      return { converged: false, turnsUsed: turn, reason: policyCheck.reason };
    } else if (policyCheck.result === 'adjusted') {
      merchantPolicyResult = 'adjusted';
      merchantReason = policyCheck.reason;
      merchantFinalMove = { ...merchantRaw, unit_price: policyCheck.adjustedPrice };
    }

    await appendTurn(sessionId, 'merchant', merchantFinalMove, merchantPolicyResult, merchantReason);

    const merchantType = merchantFinalMove.type;
    const merchantUnitPrice: number | null = merchantFinalMove.unit_price;
    const merchantQuantity: number = merchantFinalMove.quantity;

    if (merchantType === 'accept') {
      converged = true;
      console.log('[orchestrator] merchant accepted, currentOffer:', currentOffer);
      if (currentOffer) {
        try {
          const execResult = await executeDeal(sessionId, catalogItemId, mandateId, {
            unit_price: currentOffer.unit_price,
            quantity: currentOffer.quantity,
            total: currentOffer.unit_price * currentOffer.quantity,
          });
          console.log('[orchestrator] executeDeal result:', execResult);
          if (!execResult.blocked) {
            const discountGiven = (Number(catalogItem.base_price) - currentOffer.unit_price) * currentOffer.quantity;
            if (discountGiven > 0) await updateDiscountUsed(catalogItemId, discountGiven);
            await updateMandateSpend(mandateId, currentOffer.unit_price * currentOffer.quantity);
          }
        } catch (err) {
          console.error('[orchestrator] executeDeal threw an error:', err);
        }
      } else {
        console.log('[orchestrator] currentOffer was null, executeDeal NOT called');
      }
      break;
    }
    if (merchantType === 'reject') {
      await updateSessionStatus(sessionId, 'failed');
      return { converged: false, turnsUsed: turn, reason: 'Merchant rejected' };
    }

    const prevMerchantOfferPrice: number = currentOffer ? currentOffer.unit_price : 0;
    currentOffer = { unit_price: merchantUnitPrice ?? prevMerchantOfferPrice, quantity: merchantQuantity };
  } // <-- closes the while loop

  await updateSessionStatus(sessionId, converged ? 'converged' : 'failed');
  return { converged, turnsUsed: turn };
}