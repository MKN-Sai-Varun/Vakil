import { pool } from './pool';

export async function getDealBySession(sessionId: string) {
  const result = await pool.query(`SELECT * FROM deals WHERE session_id = $1`, [sessionId]);
  return result.rows[0] || null;
}

export async function createDeal(
  sessionId: string,
  finalTerms: object,
  razorpayOrderId: string
) {
  const result = await pool.query(
    `INSERT INTO deals (session_id, final_terms, razorpay_order_id, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [sessionId, finalTerms, razorpayOrderId]
  );
  return result.rows[0];
}

export async function markDealSettled(razorpayOrderId: string) {
  const result = await pool.query(
    `UPDATE deals
     SET status = 'settled', webhook_confirmed_at = now()
     WHERE razorpay_order_id = $1
     RETURNING *`,
    [razorpayOrderId]
  );
  return result.rows[0] || null;
}

export async function markDealFailed(razorpayOrderId: string) {
  await pool.query(
    `UPDATE deals SET status = 'failed' WHERE razorpay_order_id = $1`,
    [razorpayOrderId]
  );
}