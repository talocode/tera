-- Migration: Add auto top-up settings to users
-- Date: 2026-06-13

ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_topup_enabled boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_topup_amount integer DEFAULT 5;
