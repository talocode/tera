CREATE TABLE IF NOT EXISTS usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('chat_generation', 'credit_blocked', 'upload')),
  status TEXT NOT NULL DEFAULT 'succeeded' CHECK (status IN ('succeeded', 'blocked', 'failed')),
  plan TEXT NOT NULL DEFAULT 'free',
  tool TEXT,
  model TEXT,
  token_usage INTEGER NOT NULL DEFAULT 0,
  credits_charged INTEGER NOT NULL DEFAULT 0,
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  session_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_ledger_user_created_idx
  ON usage_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS usage_ledger_event_created_idx
  ON usage_ledger (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS usage_ledger_status_created_idx
  ON usage_ledger (status, created_at DESC);

CREATE INDEX IF NOT EXISTS usage_ledger_chat_session_idx
  ON usage_ledger (chat_session_id);

ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage ledger" ON usage_ledger;
CREATE POLICY "Users can view their own usage ledger"
  ON usage_ledger
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE usage_ledger IS 'Canonical usage, credit, and entitlement events for analytics and profile accounting.';
COMMENT ON COLUMN usage_ledger.credits_charged IS 'Credits charged for the event, after formula and plan rules are applied.';
COMMENT ON COLUMN usage_ledger.token_usage IS 'Total model token usage associated with the event.';
