-- Reset every user to a fresh monthly credit window again.
-- Free users receive the existing 150-credit plan allowance through application plan caps.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS free_plan_credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_plan_credits_reset_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');

UPDATE users
SET
  free_plan_credits_used = 0,
  free_plan_credits_reset_date = NOW() + INTERVAL '30 days';

ALTER TABLE users
ALTER COLUMN free_plan_credits_used SET DEFAULT 0,
ALTER COLUMN free_plan_credits_reset_date SET DEFAULT (NOW() + INTERVAL '30 days');

CREATE INDEX IF NOT EXISTS idx_users_free_plan_credits_reset_date
ON users(free_plan_credits_reset_date);
