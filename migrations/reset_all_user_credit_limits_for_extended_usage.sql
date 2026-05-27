UPDATE users
SET
  free_plan_credits_used = 0,
  free_plan_credits_reset_date = NOW() + INTERVAL '30 days',
  daily_chats = 0,
  daily_file_uploads = 0,
  chat_reset_date = NOW() + INTERVAL '1 day',
  limit_hit_chat_at = NULL,
  limit_hit_upload_at = NULL
WHERE TRUE;
