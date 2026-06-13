-- Migration: Change file uploads from daily to monthly limits
-- Date: 2026-06-13

-- Rename the column from daily_file_uploads to monthly_file_uploads
ALTER TABLE users RENAME COLUMN daily_file_uploads TO monthly_file_uploads;

-- Add upload_reset_date column for monthly upload reset tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS upload_reset_date timestamp with time zone;

-- Initialize upload_reset_date for existing users (set to 1 month from now)
UPDATE users 
SET upload_reset_date = NOW() + INTERVAL '1 month' 
WHERE upload_reset_date IS NULL;
