import { Router } from 'express';
import { pool } from '../db/pool';

export const catalogRouter = Router();

catalogRouter.post('/', async (req, res) => {
  const { merchant_id, name, base_price, floor_price, inventory_qty, daily_discount_budget, bundle_rules } = req.body;
  const result = await pool.query(
    `INSERT INTO catalog_items (merchant_id, name, base_price, floor_price, inventory_qty, daily_discount_budget, bundle_rules)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [merchant_id, name, base_price, floor_price, inventory_qty, daily_discount_budget, JSON.stringify(bundle_rules || [])]
  );
  res.json(result.rows[0]);
});