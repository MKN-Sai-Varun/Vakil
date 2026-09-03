TRUNCATE TABLE
  audit_events,
  deals,
  negotiation_turns,
  negotiation_sessions,
  mandates,
  catalog_items,
  merchants,
  users
RESTART IDENTITY CASCADE;