import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthedRequest } from '../auth/middleware';

export const merchantsRouter = Router();

merchantsRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const result = await pool.query('SELECT * FROM merchants WHERE user_id = $1', [req.user!.userId]);
  if (!result.rows[0]) return res.status(404).json({ error: 'No merchant profile for this account' });
  res.json(result.rows[0]);
});

// Dashboard: merchant's catalog items + negotiation sessions against each item
merchantsRouter.get('/me/dashboard', requireAuth, async (req: AuthedRequest, res) => {
  // Get merchant record for this user
  const merchantResult = await pool.query(
    'SELECT id FROM merchants WHERE user_id = $1',
    [req.user!.userId]
  );
  if (!merchantResult.rows[0]) return res.status(404).json({ error: 'No merchant profile for this account' });
  const merchantId = merchantResult.rows[0].id;

  // Get all catalog items for this merchant
  const itemsResult = await pool.query(
    `SELECT id, name, base_price, floor_price, inventory_qty, daily_discount_budget, bundle_rules, created_at
     FROM catalog_items WHERE merchant_id = $1 ORDER BY created_at DESC`,
    [merchantId]
  );

  // Get all sessions against those items, with deal info
  const items = itemsResult.rows;
  if (items.length === 0) return res.json({ items: [], sessions: [] });

  const itemIds = items.map((i: any) => i.id);
  const sessionsResult = await pool.query(
    `SELECT
       ns.id AS session_id,
       ns.catalog_item_id,
       ns.status,
       ns.turn_count,
       ns.created_at,
       m.principal_name AS buyer_name,
       d.razorpay_order_id,
       d.final_terms,
       d.status AS deal_status
     FROM negotiation_sessions ns
     LEFT JOIN mandates m ON ns.buyer_mandate_id = m.id
     LEFT JOIN deals d ON d.session_id = ns.id
     WHERE ns.catalog_item_id = ANY($1)
     ORDER BY ns.created_at DESC
     LIMIT 100`,
    [itemIds]
  );

  res.json({ items, sessions: sessionsResult.rows });
});