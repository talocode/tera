-- Auto-topup settings for users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS auto_topup_amount INTEGER DEFAULT 5;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS auto_topup_threshold INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS auto_topup_last_triggered TIMESTAMPTZ;

-- Credit usage breakdown tracking
CREATE TABLE IF NOT EXISTS credit_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  token_usage INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_events_user_created
ON credit_usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_usage_events_type
ON credit_usage_events (event_type, created_at DESC);
