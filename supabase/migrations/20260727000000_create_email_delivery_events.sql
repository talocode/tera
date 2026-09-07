CREATE TABLE IF NOT EXISTS email_delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT NOT NULL UNIQUE,
  provider_email_id TEXT,
  event_type TEXT NOT NULL,
  recipient_email TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_delivery_events_provider_email_idx
  ON email_delivery_events (provider_email_id);

CREATE INDEX IF NOT EXISTS email_delivery_events_type_occurred_idx
  ON email_delivery_events (event_type, occurred_at DESC);

ALTER TABLE email_delivery_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage email delivery events" ON email_delivery_events;
CREATE POLICY "Service role can manage email delivery events"
  ON email_delivery_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
