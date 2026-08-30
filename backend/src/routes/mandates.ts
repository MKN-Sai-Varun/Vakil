import { Router } from 'express';
import { pool } from '../db/pool';

export const mandatesRouter = Router();

mandatesRouter.post('/', async (req, res) => {
  const { principal_name, max_total_spend, max_unit_price, expires_at, category_allowlist } = req.body;
  const result = await pool.query(
    `INSERT INTO mandates (principal_name, max_total_spend, max_unit_price, expires_at, category_allowlist)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [principal_name, max_total_spend, max_unit_price, expires_at, category_allowlist || []]
  );
  res.json(result.rows[0]);
});