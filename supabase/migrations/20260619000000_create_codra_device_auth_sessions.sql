CREATE TABLE IF NOT EXISTS codra_device_auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_code TEXT NOT NULL UNIQUE,
  user_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired', 'denied')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_codra_device_auth_sessions_device_code ON codra_device_auth_sessions(device_code);
CREATE INDEX IF NOT EXISTS idx_codra_device_auth_sessions_status ON codra_device_auth_sessions(status);
