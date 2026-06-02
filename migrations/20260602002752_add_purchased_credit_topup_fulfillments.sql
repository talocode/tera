CREATE TABLE IF NOT EXISTS purchased_credit_topup_fulfillments (
  order_identifier TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  amount_usd NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchased_credit_topup_fulfillments_user_id
  ON purchased_credit_topup_fulfillments (user_id);

CREATE INDEX IF NOT EXISTS idx_purchased_credit_topup_fulfillments_created_at
  ON purchased_credit_topup_fulfillments (created_at DESC);

ALTER TABLE purchased_credit_topup_fulfillments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage purchased credit topup fulfillments" ON purchased_credit_topup_fulfillments;
CREATE POLICY "Service role can manage purchased credit topup fulfillments"
  ON purchased_credit_topup_fulfillments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION apply_purchased_credit_topup(
  p_user_id UUID,
  p_order_identifier TEXT,
  p_order_number TEXT,
  p_credits INTEGER,
  p_amount_usd NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_credits IS NULL OR p_credits <= 0 THEN
    RAISE EXCEPTION 'Top-up credits must be greater than zero';
  END IF;

  IF p_order_identifier IS NULL OR length(trim(p_order_identifier)) = 0 THEN
    RAISE EXCEPTION 'Order identifier is required';
  END IF;

  IF p_order_number IS NULL OR length(trim(p_order_number)) = 0 THEN
    RAISE EXCEPTION 'Order number is required';
  END IF;

  INSERT INTO purchased_credit_topup_fulfillments (
    order_identifier,
    user_id,
    order_number,
    credits,
    amount_usd
  )
  VALUES (
    p_order_identifier,
    p_user_id,
    p_order_number,
    p_credits,
    p_amount_usd
  )
  ON CONFLICT (order_identifier) DO NOTHING;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE users
  SET purchased_credits_balance = COALESCE(purchased_credits_balance, 0) + p_credits
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION apply_purchased_credit_topup(UUID, TEXT, TEXT, INTEGER, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION apply_purchased_credit_topup(UUID, TEXT, TEXT, INTEGER, NUMERIC) TO service_role;

COMMENT ON TABLE purchased_credit_topup_fulfillments IS 'Idempotency ledger for Lemon Squeezy one-time credit top-ups.';
COMMENT ON FUNCTION apply_purchased_credit_topup(UUID, TEXT, TEXT, INTEGER, NUMERIC) IS 'Atomically records a top-up order and increments the user purchased credit balance once.';
