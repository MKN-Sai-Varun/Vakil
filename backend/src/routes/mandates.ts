import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthedRequest } from '../auth/middleware';

export const mandatesRouter = Router();

mandatesRouter.post('/', requireAuth, async (req: AuthedRequest, res) => {
  const { principal_name, max_total_spend, max_unit_price, expires_at, category_allowlist } = req.body;
  const result = await pool.query(
    `INSERT INTO mandates (principal_name, max_total_spend, max_unit_price, expires_at, category_allowlist, user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [principal_name, max_total_spend, max_unit_price, expires_at, category_allowlist || [], req.user!.userId]
  );
  res.json(result.rows[0]);
});