UPDATE mandates SET spend_used = 0, max_total_spend = 20000, max_unit_price = 1000
WHERE id = '33333333-3333-3333-3333-333333333333';

UPDATE catalog_items SET discount_used_today = 0, base_price = 1000, floor_price = 750, inventory_qty = 20, daily_discount_budget = 5000
WHERE id = '22222222-2222-2222-2222-222222222222';

DELETE FROM negotiation_turns WHERE session_id IN (SELECT id FROM negotiation_sessions);
DELETE FROM audit_events;
DELETE FROM deals;
DELETE FROM negotiation_sessions;