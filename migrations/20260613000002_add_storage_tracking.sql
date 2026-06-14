-- Migration: Add storage tracking to users
-- Date: 2026-06-13

ALTER TABLE users ADD COLUMN IF NOT EXISTS storage_used_bytes bigint DEFAULT 0;
