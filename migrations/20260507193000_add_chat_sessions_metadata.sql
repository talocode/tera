-- Store rollout-safe chat metadata such as selected chat mode.
ALTER TABLE public.chat_sessions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
