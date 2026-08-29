CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price > 0),
  floor_price NUMERIC(12,2) NOT NULL CHECK (floor_price > 0),
  discount_ladder JSONB NOT NULL DEFAULT '[]',
  bundle_rules JSONB NOT NULL DEFAULT '[]',
  inventory_qty INTEGER NOT NULL CHECK (inventory_qty >= 0),
  daily_discount_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_used_today NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT floor_below_base CHECK (floor_price <= base_price)
);

CREATE TABLE mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principal_name TEXT NOT NULL,
  max_total_spend NUMERIC(12,2) NOT NULL CHECK (max_total_spend > 0),
  max_unit_price NUMERIC(12,2) NOT NULL CHECK (max_unit_price > 0),
  category_allowlist TEXT[] NOT NULL DEFAULT '{}',
  spend_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT spend_used_within_cap CHECK (spend_used <= max_total_spend)
);

CREATE TABLE negotiation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_mandate_id UUID NOT NULL REFERENCES mandates(id),
  catalog_item_id UUID NOT NULL REFERENCES catalog_items(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'converged', 'failed', 'expired')),
  turn_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converged_at TIMESTAMPTZ
);

CREATE TABLE negotiation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES negotiation_sessions(id),
  turn_number INTEGER NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('buyer', 'merchant')),
  proposed_move JSONB NOT NULL,
  policy_result TEXT NOT NULL CHECK (policy_result IN ('pass', 'blocked', 'adjusted')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, turn_number)
);
CREATE INDEX idx_turns_session_created ON negotiation_turns (session_id, created_at);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES negotiation_sessions(id) UNIQUE,
  final_terms JSONB NOT NULL,
  razorpay_order_id TEXT,
  webhook_confirmed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settled', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_deal ON audit_events (deal_id, created_at);