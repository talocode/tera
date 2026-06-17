CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS TABLE (
  active_learners bigint,
  chat_sessions bigint,
  prompts_processed bigint,
  uptime_percent numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_usage_ledger boolean := to_regclass('public.usage_ledger') IS NOT NULL;
  successful_prompt_events bigint := 0;
  total_prompt_events bigint := 0;
BEGIN
  SELECT COUNT(DISTINCT cs.user_id)
    INTO active_learners
  FROM public.chat_sessions cs
  WHERE cs.user_id IS NOT NULL
    AND cs.created_at >= NOW() - INTERVAL '30 days';

  SELECT COUNT(DISTINCT cs.session_id)
    INTO chat_sessions
  FROM public.chat_sessions cs
  WHERE cs.session_id IS NOT NULL;

  IF has_usage_ledger THEN
    SELECT COUNT(*)
      INTO successful_prompt_events
    FROM public.usage_ledger ul
    WHERE ul.event_type = 'chat_generation'
      AND ul.status = 'succeeded';

    SELECT COUNT(*)
      INTO total_prompt_events
    FROM public.usage_ledger ul
    WHERE ul.event_type = 'chat_generation'
      AND ul.status IN ('succeeded', 'blocked', 'failed');

    prompts_processed := successful_prompt_events;

    IF total_prompt_events > 0 THEN
      uptime_percent := ROUND((successful_prompt_events::numeric / total_prompt_events::numeric) * 100, 1);
    ELSE
      uptime_percent := 99.9;
    END IF;
  ELSE
    SELECT COUNT(*)
      INTO prompts_processed
    FROM public.chat_sessions cs;

    uptime_percent := 99.9;
  END IF;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_homepage_stats() TO anon, authenticated, service_role;
