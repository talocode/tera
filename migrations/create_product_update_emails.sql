CREATE TABLE IF NOT EXISTS product_update_emails (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'dry_run')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_update_emails_user_id
ON product_update_emails(user_id);

CREATE INDEX IF NOT EXISTS idx_product_update_emails_created_at
ON product_update_emails(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_update_emails_status
ON product_update_emails(status);

ALTER TABLE product_update_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage product update emails" ON product_update_emails;

CREATE POLICY "Service role can manage product update emails"
ON product_update_emails
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
