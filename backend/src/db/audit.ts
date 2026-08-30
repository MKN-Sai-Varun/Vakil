import { pool } from './pool';

export async function logAuditEvent(dealId: string | null, eventType: string, payload: object) {
  await pool.query(
    `INSERT INTO audit_events (deal_id, event_type, payload) VALUES ($1, $2, $3)`,
    [dealId, eventType, payload]
  );
}