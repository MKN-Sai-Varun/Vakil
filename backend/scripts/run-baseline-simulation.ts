import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../src/db/pool';
import { runNegotiation } from '../src/orchestrator/orchestrator';

const SIMULATION_MERCHANT_ID = '11111111-1111-1111-1111-111111111111'; // existing seed merchant
const N_BUYERS = 5;

interface SimResult {
  buyerIndex: number;
  maxUnitPrice: number;
  maxTotalSpend: number;
  fixedPriceClosed: boolean;
  fixedPriceMargin: number;
  vakilNegotiated: boolean;       // negotiation converged
  vakilActuallyClosed: boolean;   // real deal row exists
  vakilFinalPrice: number | null;
  vakilFinalQuantity: number | null;
  vakilMargin: number;
  vakilTurns: number;
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

async function createSimCatalogItem(basePrice: number, floorPrice: number) {
  const result = await pool.query(
    `INSERT INTO catalog_items (merchant_id, name, base_price, floor_price, inventory_qty, daily_discount_budget)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [SIMULATION_MERCHANT_ID, 'Simulation Item', basePrice, floorPrice, 1000, 999999]
  );
  return result.rows[0];
}

async function createSimMandate(maxUnitPrice: number, maxTotalSpend: number) {
  const result = await pool.query(
    `INSERT INTO mandates (principal_name, max_total_spend, max_unit_price, expires_at)
     VALUES ($1, $2, $3, now() + interval '1 day') RETURNING *`,
    [`Sim Buyer`, maxTotalSpend, maxUnitPrice]
  );
  return result.rows[0];
}

async function main() {
  const basePrice = 1000;
  const floorPrice = 750;
  const quantity = 10;

  console.log(`Running baseline-vs-Vakil simulation: ${N_BUYERS} synthetic buyers`);
  console.log(`Catalog: base=${basePrice}, floor=${floorPrice}, quantity=${quantity}\n`);

  const catalogItem = await createSimCatalogItem(basePrice, floorPrice);
  const results: SimResult[] = [];

  for (let i = 0; i < N_BUYERS; i++) {
    // Spread buyer ceilings across a realistic range: some below list, some above, some below floor entirely
    const maxUnitPrice = randomBetween(650, 1100);
    const maxTotalSpend = maxUnitPrice * quantity + randomBetween(0, 2000);

    console.log(`Buyer ${i + 1}/${N_BUYERS}: max_unit_price=${maxUnitPrice}, max_total_spend=${maxTotalSpend}`);

    const mandate = await createSimMandate(maxUnitPrice, maxTotalSpend);

    // --- Fixed price condition (no negotiation, simple threshold check) ---
    const fixedPriceClosed = maxUnitPrice >= basePrice;
    const fixedPriceMargin = fixedPriceClosed ? (basePrice - floorPrice) * quantity : 0;

    // --- Vakil condition (real negotiation) ---
    const sessionResult = await pool.query(
      `INSERT INTO negotiation_sessions (buyer_mandate_id, catalog_item_id) VALUES ($1, $2) RETURNING *`,
      [mandate.id, catalogItem.id]
    );
    const session = sessionResult.rows[0];

    const negotiationResult = await runNegotiation(session.id, catalogItem.id, mandate.id,6);
    console.log(`  [debug] negotiationResult:`, negotiationResult);

    let vakilFinalPrice: number | null = null;
    let vakilFinalQuantity: number | null = null;
    let vakilMargin = 0;
    let vakilActuallyClosed = false;

    if (negotiationResult.converged) {
      const dealResult = await pool.query(
        `SELECT final_terms FROM deals WHERE session_id = $1`,
        [session.id]
      );
      if (dealResult.rows[0]) {
        vakilFinalPrice = Number(dealResult.rows[0].final_terms.unit_price);
        vakilFinalQuantity = Number(dealResult.rows[0].final_terms.quantity);
        vakilMargin = (vakilFinalPrice - floorPrice) * vakilFinalQuantity;
        vakilActuallyClosed = true;
      }
    }

    results.push({
      buyerIndex: i + 1,
      maxUnitPrice,
      maxTotalSpend,
      fixedPriceClosed,
      fixedPriceMargin,
      vakilNegotiated: negotiationResult.converged,
      vakilActuallyClosed,
      vakilFinalPrice,
      vakilFinalQuantity,
      vakilMargin,
      vakilTurns: negotiationResult.turnsUsed,
    });

    const vakilStatus = vakilActuallyClosed
      ? `CLOSED @ ${vakilFinalPrice}`
      : negotiationResult.converged
        ? 'NEGOTIATED but blocked (no deal row)'
        : 'no deal';

    console.log(
      `  → Fixed price: ${fixedPriceClosed ? 'CLOSED' : 'no deal'} | Vakil: ${vakilStatus} (${negotiationResult.turnsUsed} turns)\n`
    );
  }

  // --- Aggregate report ---
  const fixedClosedCount = results.filter((r) => r.fixedPriceClosed).length;
  const vakilNegotiatedCount = results.filter((r) => r.vakilNegotiated).length;
  const vakilActuallyClosedCount = results.filter((r) => r.vakilActuallyClosed).length;
  const totalFixedMargin = results.reduce((sum, r) => sum + r.fixedPriceMargin, 0);
  const totalVakilMargin = results.reduce((sum, r) => sum + r.vakilMargin, 0);

  const recoveredNegotiated = results.filter((r) => r.vakilNegotiated && !r.fixedPriceClosed).length;
  const recoveredActuallyClosed = results.filter((r) => r.vakilActuallyClosed && !r.fixedPriceClosed).length;

  console.log('\n========== SIMULATION RESULTS ==========');
  console.log(`Buyers simulated: ${N_BUYERS}`);
  console.log(`\nFixed Price:              ${fixedClosedCount}/${N_BUYERS} closed (${((fixedClosedCount / N_BUYERS) * 100).toFixed(0)}%) | Total margin: ₹${totalFixedMargin}`);
  console.log(`Vakil (negotiated):       ${vakilNegotiatedCount}/${N_BUYERS} converged (${((vakilNegotiatedCount / N_BUYERS) * 100).toFixed(0)}%)`);
  console.log(`Vakil (actually closed):  ${vakilActuallyClosedCount}/${N_BUYERS} real deals (${((vakilActuallyClosedCount / N_BUYERS) * 100).toFixed(0)}%) | Total margin: ₹${totalVakilMargin}`);
  console.log(`\nRecovered (negotiation only): ${recoveredNegotiated}`);
  console.log(`Recovered (real deal):        ${recoveredActuallyClosed}`);
  console.log('=========================================\n');

  console.log('Per-buyer detail:');
  console.table(
    results.map((r) => ({
      Buyer: r.buyerIndex,
      MaxUnitPrice: r.maxUnitPrice,
      FixedPrice: r.fixedPriceClosed ? 'Closed' : 'Lost',
      VakilNegotiated: r.vakilNegotiated ? 'Yes' : 'No',
      VakilClosed: r.vakilActuallyClosed ? `Closed @ ${r.vakilFinalPrice}` : 'No',
      VakilTurns: r.vakilTurns,
      Margin: r.vakilMargin,
    }))
  );

  // Cleanup: remove simulation data so it doesn't pollute the real ledger
  console.log(`\nSimulation catalog item ID (for debugging): ${catalogItem.id}`);
  console.log('Run cleanup manually once verified:');
  console.log(`  psql $DATABASE_URL -c "DELETE FROM negotiation_turns WHERE session_id IN (SELECT id FROM negotiation_sessions WHERE catalog_item_id = '${catalogItem.id}');"`);
  console.log(`  psql $DATABASE_URL -c "DELETE FROM deals WHERE session_id IN (SELECT id FROM negotiation_sessions WHERE catalog_item_id = '${catalogItem.id}');"`);
  console.log(`  psql $DATABASE_URL -c "DELETE FROM negotiation_sessions WHERE catalog_item_id = '${catalogItem.id}';"`);
  console.log(`  psql $DATABASE_URL -c "DELETE FROM mandates WHERE principal_name = 'Sim Buyer';"`);
  console.log(`  psql $DATABASE_URL -c "DELETE FROM catalog_items WHERE id = '${catalogItem.id}';"`);

  await pool.end();
}

main().catch((err) => {
  console.error('Simulation failed:', err);
  process.exit(1);
});