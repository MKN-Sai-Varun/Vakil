import { pool } from './pool';

export async function getCatalogItem(id: string) {
  const result = await pool.query(`SELECT * FROM catalog_items WHERE id = $1`, [id]);
  return result.rows[0];
}

export async function getMandate(id: string) {
  const result = await pool.query(`SELECT * FROM mandates WHERE id = $1`, [id]);
  return result.rows[0];
}

export async function updateMandateSpend(id: string, additionalSpend: number) {
  await pool.query(
    `UPDATE mandates SET spend_used = spend_used + $2 WHERE id = $1`,
    [id, additionalSpend]
  );
}

export async function updateDiscountUsed(id: string, additionalDiscount: number) {
  await pool.query(
    `UPDATE catalog_items SET discount_used_today = discount_used_today + $2 WHERE id = $1`,
    [id, additionalDiscount]
  );
}