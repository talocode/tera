-- Ensure chat_sessions has session_id/title required by server actions and admin analytics.
-- Keep this copy aligned with supabase/migrations for environments using the root migrations folder.

ALTER TABLE chat_sessions
ADD COLUMN IF NOT EXISTS session_id UUID,
ADD COLUMN IF NOT EXISTS title TEXT;

UPDATE chat_sessions
SET session_id = gen_random_uuid()
WHERE session_id IS NULL;

ALTER TABLE chat_sessions
ALTER COLUMN session_id SET DEFAULT gen_random_uuid(),
ALTER COLUMN session_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id
ON chat_sessions (session_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_session_created_at
ON chat_sessions (user_id, session_id, created_at DESC);
