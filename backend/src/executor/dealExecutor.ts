import { razorpay } from './razorpayClient';
import { getDealBySession, createDeal } from '../db/deals';
import { getCatalogItem, getMandate } from '../db/catalog';
import { logAuditEvent } from '../db/audit';

interface FinalTerms {
  unit_price: number;
  quantity: number;
  total: number;
}

export async function executeDeal(
  sessionId: string,
  catalogItemId: string,
  mandateId: string,
  finalTerms: FinalTerms
) {
  // --- Idempotency check: has this session already been settled/attempted? ---
  const existingDeal = await getDealBySession(sessionId);
  if (existingDeal) {
    return { alreadyExists: true, deal: existingDeal };
  }

  // --- Dual final re-check: fresh inventory + fresh mandate remaining ---
  const catalogItem = await getCatalogItem(catalogItemId);
  const mandate = await getMandate(mandateId);

  if (catalogItem.inventory_qty < finalTerms.quantity) {
    await logAuditEvent(null, 'settlement_blocked', {
      session_id: sessionId,
      reason: `Inventory race: only ${catalogItem.inventory_qty} left, deal needs ${finalTerms.quantity}`,
    });
    return { alreadyExists: false, blocked: true, reason: 'inventory_unavailable' };
  }

  const remainingSpend = Number(mandate.max_total_spend) - Number(mandate.spend_used);
  if (finalTerms.total > remainingSpend) {
    await logAuditEvent(null, 'settlement_blocked', {
      session_id: sessionId,
      reason: `Mandate remaining ${remainingSpend} insufficient for final total ${finalTerms.total}`,
    });
    return { alreadyExists: false, blocked: true, reason: 'mandate_insufficient' };
  }

  // --- Create the Razorpay order (amount in paise, per Day 1's capability matrix) ---
  const amountInPaise = Math.round(finalTerms.total * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `session_${sessionId}`,
    notes: {
      session_id: sessionId,
      unit_price: String(finalTerms.unit_price),
      quantity: String(finalTerms.quantity),
    },
  });

  const deal = await createDeal(sessionId, finalTerms, order.id);
  await logAuditEvent(deal.id, 'order_created', { razorpay_order_id: order.id, amount: amountInPaise });

  return { alreadyExists: false, blocked: false, deal, razorpayOrder: order };
}