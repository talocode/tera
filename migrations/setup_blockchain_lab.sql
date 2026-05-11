-- Setup Blockchain Lab Tables
-- Educational blockchain simulator ("tera-simnet") — fully simulated, no real crypto

-- ============================================================================
-- 1. Wallets
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'tera-simnet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bclab_wallets_user ON blockchain_lab_wallets(user_id);

-- ============================================================================
-- 2. Balances
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES blockchain_lab_wallets(id) ON DELETE CASCADE NOT NULL,
  token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDC', 'ETH', 'TERA')),
  amount NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_id, token_symbol)
);

CREATE INDEX IF NOT EXISTS idx_bclab_balances_wallet ON blockchain_lab_balances(wallet_id);

-- ============================================================================
-- 3. Blocks
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  block_number INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  previous_block_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, block_number)
);

CREATE INDEX IF NOT EXISTS idx_bclab_blocks_user ON blockchain_lab_blocks(user_id, block_number DESC);

-- ============================================================================
-- 4. Transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  hash TEXT NOT NULL,
  from_wallet_id UUID REFERENCES blockchain_lab_wallets(id) ON DELETE CASCADE NOT NULL,
  to_wallet_id UUID REFERENCES blockchain_lab_wallets(id) ON DELETE CASCADE NOT NULL,
  token_symbol TEXT NOT NULL CHECK (token_symbol IN ('USDC', 'ETH', 'TERA')),
  amount NUMERIC NOT NULL,
  gas_fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_id UUID REFERENCES blockchain_lab_blocks(id) ON DELETE SET NULL,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_bclab_tx_user_status ON blockchain_lab_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bclab_tx_hash ON blockchain_lab_transactions(hash);
CREATE INDEX IF NOT EXISTS idx_bclab_tx_block ON blockchain_lab_transactions(block_id);

-- ============================================================================
-- 5. Lessons
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================================
-- 6. Progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  lesson_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_bclab_progress_user ON blockchain_lab_progress(user_id, lesson_slug);

-- ============================================================================
-- 7. Badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT
);

-- ============================================================================
-- 8. User Badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  badge_slug TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_slug)
);

CREATE INDEX IF NOT EXISTS idx_bclab_user_badges_user ON blockchain_lab_user_badges(user_id);

-- ============================================================================
-- 9. Public Profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS blockchain_lab_public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================
ALTER TABLE blockchain_lab_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_lab_public_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Wallets: users own their wallets
CREATE POLICY "Users can view their wallets"
  ON blockchain_lab_wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create wallets"
  ON blockchain_lab_wallets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their wallets"
  ON blockchain_lab_wallets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their wallets"
  ON blockchain_lab_wallets FOR DELETE
  USING (user_id = auth.uid());

-- Balances: accessible through wallet ownership
CREATE POLICY "Users can view balances of their wallets"
  ON blockchain_lab_balances FOR SELECT
  USING (wallet_id IN (SELECT id FROM blockchain_lab_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert balances for their wallets"
  ON blockchain_lab_balances FOR INSERT
  WITH CHECK (wallet_id IN (SELECT id FROM blockchain_lab_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Users can update balances of their wallets"
  ON blockchain_lab_balances FOR UPDATE
  USING (wallet_id IN (SELECT id FROM blockchain_lab_wallets WHERE user_id = auth.uid()));

-- Blocks: users own their blocks
CREATE POLICY "Users can view their blocks"
  ON blockchain_lab_blocks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create blocks"
  ON blockchain_lab_blocks FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Transactions: users own their transactions
CREATE POLICY "Users can view their transactions"
  ON blockchain_lab_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create transactions"
  ON blockchain_lab_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their transactions"
  ON blockchain_lab_transactions FOR UPDATE
  USING (user_id = auth.uid());

-- Lessons: public read, no insert/update/delete by users
CREATE POLICY "Anyone can view published lessons"
  ON blockchain_lab_lessons FOR SELECT
  USING (is_published = TRUE);

-- Progress: users own their progress
CREATE POLICY "Users can view their progress"
  ON blockchain_lab_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert progress"
  ON blockchain_lab_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their progress"
  ON blockchain_lab_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Badges: public read
CREATE POLICY "Anyone can view badges"
  ON blockchain_lab_badges FOR SELECT
  USING (TRUE);

-- User Badges: users own their earned badges
CREATE POLICY "Users can view their earned badges"
  ON blockchain_lab_user_badges FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can earn badges"
  ON blockchain_lab_user_badges FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Public Profiles: public read when is_public, users manage their own
CREATE POLICY "Anyone can view public profiles"
  ON blockchain_lab_public_profiles FOR SELECT
  USING (is_public = TRUE OR user_id = auth.uid());

CREATE POLICY "Users can upsert their profile"
  ON blockchain_lab_public_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their profile"
  ON blockchain_lab_public_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- Seed Data: Lessons
-- ============================================================================
INSERT INTO blockchain_lab_lessons (slug, title, description, order_index)
VALUES
  ('wallet-basics', 'Wallet Basics', 'Learn what a blockchain wallet is, how addresses and keys work, and create your first simulated wallet.', 1),
  ('stablecoin-transfer', 'Stablecoin Transfer', 'Understand how stablecoins move on-chain and send your first simulated USDC transfer.', 2),
  ('block-confirmations', 'Block Confirmations', 'Explore how transactions get confirmed and added to blocks, and see the chain grow.', 3),
  ('block-explorer-basics', 'Block Explorer Basics', 'Learn how to use a block explorer to inspect transactions, blocks, and wallet activity.', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Seed Data: Badges
-- ============================================================================
INSERT INTO blockchain_lab_badges (slug, title, description, icon)
VALUES
  ('first-wallet', 'First Wallet', 'Created your first simulated blockchain wallet.', 'wallet'),
  ('first-transfer', 'First Transfer', 'Sent your first token transfer on the simulated network.', 'arrow-right-circle'),
  ('block-explorer', 'Block Explorer', 'Used the block explorer to inspect a transaction or block.', 'search'),
  ('stablecoin-basics', 'Stablecoin Basics', 'Completed the stablecoin transfer lesson.', 'dollar-sign'),
  ('blockchain-beginner', 'Blockchain Beginner', 'Earned all four core blockchain lab badges.', 'award')
ON CONFLICT (slug) DO NOTHING;
