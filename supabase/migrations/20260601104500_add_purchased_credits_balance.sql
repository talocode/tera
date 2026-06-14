ALTER TABLE users
ADD COLUMN IF NOT EXISTS purchased_credits_balance INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN users.purchased_credits_balance IS 'One-time purchased credits on top of plan allocation.';
