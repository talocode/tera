CREATE TABLE IF NOT EXISTS transactional_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  dedupe_key TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS transactional_email_events_dedupe_key_sent_idx
  ON transactional_email_events (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status = 'sent';

CREATE INDEX IF NOT EXISTS transactional_email_events_user_created_idx
  ON transactional_email_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS transactional_email_events_type_created_idx
  ON transactional_email_events (type, created_at DESC);
