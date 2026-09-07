CREATE TABLE IF NOT EXISTS tiktok_oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tiktok_connections (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  open_id TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  refresh_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tiktok_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages TikTok OAuth states" ON tiktok_oauth_states;
CREATE POLICY "Service role manages TikTok OAuth states" ON tiktok_oauth_states FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "Service role manages TikTok connections" ON tiktok_connections;
CREATE POLICY "Service role manages TikTok connections" ON tiktok_connections FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
