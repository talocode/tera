CREATE TABLE IF NOT EXISTS product_update_broadcasts (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'sent', 'failed', 'skipped')),
  recipient_count INTEGER,
  sent_count INTEGER,
  failed_count INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_product_update_broadcasts_source
ON product_update_broadcasts(source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_update_broadcasts_status
ON product_update_broadcasts(status);

ALTER TABLE product_update_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage product update broadcasts" ON product_update_broadcasts;

CREATE POLICY "Service role can manage product update broadcasts"
ON product_update_broadcasts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
