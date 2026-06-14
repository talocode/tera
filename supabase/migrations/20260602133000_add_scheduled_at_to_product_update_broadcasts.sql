ALTER TABLE product_update_broadcasts
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE product_update_broadcasts
  DROP CONSTRAINT IF EXISTS product_update_broadcasts_status_check;

ALTER TABLE product_update_broadcasts
  ADD CONSTRAINT product_update_broadcasts_status_check
  CHECK (status IN ('scheduled', 'started', 'sent', 'failed', 'skipped'));

CREATE INDEX IF NOT EXISTS idx_product_update_broadcasts_scheduled_at
  ON product_update_broadcasts(scheduled_at);

COMMENT ON COLUMN product_update_broadcasts.scheduled_at IS 'Time when a scheduled broadcast should be sent.';
COMMENT ON COLUMN product_update_broadcasts.processed_at IS 'Time when a scheduled broadcast was processed.';
