import { pool } from './pool';

export async function createSession(mandateId: string, catalogItemId: string) {
  const result = await pool.query(
    `INSERT INTO negotiation_sessions (buyer_mandate_id, catalog_item_id)
     VALUES ($1, $2) RETURNING *`,
    [mandateId, catalogItemId]
  );
  return result.rows[0];
}

export async function getSession(id: string) {
  const result = await pool.query(
    `SELECT * FROM negotiation_sessions WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function updateSessionStatus(id: string, status: string) {
  await pool.query(
    `UPDATE negotiation_sessions
     SET status = $2, converged_at = CASE WHEN $2 = 'converged' THEN now() ELSE converged_at END
     WHERE id = $1`,
    [id, status]
  );
}

export async function appendTurn(
  sessionId: string,
  actor: 'buyer' | 'merchant',
  move: object,
  policyResult: 'pass' | 'blocked' | 'adjusted',
  reason: string
) {
  const countRes = await pool.query(
    `SELECT COALESCE(MAX(turn_number), 0) + 1 AS next_turn
     FROM negotiation_turns WHERE session_id = $1`,
    [sessionId]
  );
  const nextTurn = countRes.rows[0].next_turn;

  const result = await pool.query(
    `INSERT INTO negotiation_turns (session_id, turn_number, actor, proposed_move, policy_result, reason)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [sessionId, nextTurn, actor, move, policyResult, reason]
  );
  await pool.query(
    `UPDATE negotiation_sessions SET turn_count = $2 WHERE id = $1`,
    [sessionId, nextTurn]
  );
  return result.rows[0];
}

export async function getTurns(sessionId: string) {
  const result = await pool.query(
    `SELECT * FROM negotiation_turns WHERE session_id = $1 ORDER BY turn_number ASC`,
    [sessionId]
  );
  return result.rows;
}
