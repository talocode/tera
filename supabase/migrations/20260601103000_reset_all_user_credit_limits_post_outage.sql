-- Reset all user credit windows after the May 20-28 outage and deployment migration.
-- This gives every account a fresh credit cycle immediately.

UPDATE users
SET
  free_plan_credits_used = 0,
  free_plan_credits_reset_date = NOW() + INTERVAL '30 days',
  chat_reset_date = NOW() + INTERVAL '1 day',
  daily_chats = 0,
  daily_file_uploads = 0,
  limit_hit_chat_at = NULL,
  limit_hit_upload_at = NULL
WHERE id IS NOT NULL;
