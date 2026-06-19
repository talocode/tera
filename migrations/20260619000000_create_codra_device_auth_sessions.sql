-- Codra Device Auth Sessions table for CLI authentication
-- This table stores device login sessions for Codra Code CLI

CREATE TABLE IF NOT EXISTS codra_device_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code VARCHAR(64) UNIQUE NOT NULL,
  user_code VARCHAR(8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired', 'denied')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  cli_token_hash VARCHAR(255),
  cli_token_prefix VARCHAR(10),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient polling
CREATE INDEX IF NOT EXISTS idx_codra_device_auth_device_code 
  ON codra_device_auth_sessions(device_code);

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_codra_device_auth_expires_at 
  ON codra_device_auth_sessions(expires_at);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_codra_device_auth_user_id 
  ON codra_device_auth_sessions(user_id);

-- RLS policies
ALTER TABLE codra_device_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all records
CREATE POLICY "Service role can manage codra device auth sessions" 
  ON codra_device_auth_sessions 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own sessions
CREATE POLICY "Users can read their own codra device auth sessions" 
  ON codra_device_auth_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own sessions (for approval)
CREATE POLICY "Users can update their own codra device auth sessions" 
  ON codra_device_auth_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_codra_device_auth_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER update_codra_device_auth_sessions_updated_at
  BEFORE UPDATE ON codra_device_auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_codra_device_auth_sessions_updated_at();

-- Function to clean up expired sessions (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_codra_device_auth_sessions()
RETURNS void AS $$
BEGIN
  UPDATE codra_device_auth_sessions 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  DELETE FROM codra_device_auth_sessions 
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
