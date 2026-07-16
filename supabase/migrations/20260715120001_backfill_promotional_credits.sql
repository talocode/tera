-- Move the 200-credit promotional batch from purchased_credits_balance to promotional_credits
-- Only for users who still have the full or partial batch remaining

UPDATE users
SET
  promotional_credits = LEAST(purchased_credits_balance, 200),
  promotional_credits_expiry = '2026-08-15T00:00:00Z',
  purchased_credits_balance = GREATEST(purchased_credits_balance - 200, 0)
WHERE purchased_credits_balance > 0;
