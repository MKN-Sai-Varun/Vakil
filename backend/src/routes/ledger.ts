import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../auth/middleware';

export const ledgerRouter = Router();

ledgerRouter.use(requireAuth);

ledgerRouter.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT
      ns.id AS session_id,
      ns.status,
      ns.turn_count,
      ns.created_at,
      ns.converged_at,
      ci.name AS item_name,
      m.principal_name AS buyer_name,
      d.razorpay_order_id,
      d.status AS deal_status,
      d.final_terms
    FROM negotiation_sessions ns
    LEFT JOIN catalog_items ci ON ns.catalog_item_id = ci.id
    LEFT JOIN mandates m ON ns.buyer_mandate_id = m.id
    LEFT JOIN deals d ON d.session_id = ns.id
    ORDER BY ns.created_at DESC
    LIMIT 50
  `);
  res.json(result.rows);
});

ledgerRouter.get('/:sessionId', async (req, res) => {
  const sessionResult = await pool.query(
    `SELECT ns.*, ci.name AS item_name, m.principal_name AS buyer_name
     FROM negotiation_sessions ns
     LEFT JOIN catalog_items ci ON ns.catalog_item_id = ci.id
     LEFT JOIN mandates m ON ns.buyer_mandate_id = m.id
     WHERE ns.id = $1`,
    [req.params.sessionId]
  );
  if (!sessionResult.rows[0]) return res.status(404).json({ error: 'not found' });

  const turnsResult = await pool.query(
    `SELECT * FROM negotiation_turns WHERE session_id = $1 ORDER BY turn_number ASC`,
    [req.params.sessionId]
  );

  const dealResult = await pool.query(
    `SELECT * FROM deals WHERE session_id = $1`,
    [req.params.sessionId]
  );

  const auditResult = await pool.query(
    `SELECT * FROM audit_events WHERE deal_id = $1 ORDER BY created_at ASC`,
    [dealResult.rows[0]?.id || null]
  );

  res.json({
    ...sessionResult.rows[0],
    turns: turnsResult.rows,
    deal: dealResult.rows[0] || null,
    auditEvents: auditResult.rows,
  });
});