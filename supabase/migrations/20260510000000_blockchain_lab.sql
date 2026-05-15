-- Blockchain Lab: Educational blockchain simulator
-- This is a safe, AI-guided simulation for learning blockchain concepts

-- Wallets table
create table if not exists blockchain_lab_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  address text not null unique,
  network text not null default 'tera-simnet',
  created_at timestamptz not null default now()
);

-- Balances table
create table if not exists blockchain_lab_balances (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references blockchain_lab_wallets(id) on delete cascade,
  token_symbol text not null,
  amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique(wallet_id, token_symbol)
);

-- Blocks table
create table if not exists blockchain_lab_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  block_number integer not null,
  block_hash text not null unique,
  previous_block_hash text,
  created_at timestamptz not null default now()
);

-- Transactions table
create table if not exists blockchain_lab_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  hash text not null unique,
  from_wallet_id uuid references blockchain_lab_wallets(id) on delete set null,
  to_wallet_id uuid references blockchain_lab_wallets(id) on delete set null,
  token_symbol text not null,
  amount numeric not null,
  gas_fee numeric not null default 0,
  status text not null check (status in ('pending', 'confirmed', 'failed')),
  block_id uuid references blockchain_lab_blocks(id) on delete set null,
  failure_reason text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

-- Lessons table
create table if not exists blockchain_lab_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  difficulty text not null default 'beginner',
  order_index integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Progress table
create table if not exists blockchain_lab_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_slug text not null,
  status text not null check (status in ('not_started', 'in_progress', 'completed')),
  score integer default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_slug)
);

-- Badges table
create table if not exists blockchain_lab_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  icon text,
  created_at timestamptz not null default now()
);

-- User badges table
create table if not exists blockchain_lab_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_slug text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_slug)
);

-- Public profiles table
create table if not exists blockchain_lab_public_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  username text not null unique,
  display_name text,
  bio text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_blockchain_lab_wallets_user_id on blockchain_lab_wallets(user_id);
create index if not exists idx_blockchain_lab_transactions_user_id on blockchain_lab_transactions(user_id);
create index if not exists idx_blockchain_lab_transactions_hash on blockchain_lab_transactions(hash);
create index if not exists idx_blockchain_lab_blocks_user_id on blockchain_lab_blocks(user_id);
create index if not exists idx_blockchain_lab_blocks_block_hash on blockchain_lab_blocks(block_hash);
create index if not exists idx_blockchain_lab_progress_user_id on blockchain_lab_progress(user_id);
create index if not exists idx_blockchain_lab_user_badges_user_id on blockchain_lab_user_badges(user_id);

-- Enable RLS
alter table blockchain_lab_wallets enable row level security;
alter table blockchain_lab_balances enable row level security;
alter table blockchain_lab_blocks enable row level security;
alter table blockchain_lab_transactions enable row level security;
alter table blockchain_lab_lessons enable row level security;
alter table blockchain_lab_progress enable row level security;
alter table blockchain_lab_badges enable row level security;
alter table blockchain_lab_user_badges enable row level security;
alter table blockchain_lab_public_profiles enable row level security;

-- RLS Policies for blockchain_lab_wallets
drop policy if exists "Users can view own wallets" on blockchain_lab_wallets;
create policy "Users can view own wallets" on blockchain_lab_wallets for select using (user_id = auth.uid());

drop policy if exists "Users can create own wallets" on blockchain_lab_wallets;
create policy "Users can create own wallets" on blockchain_lab_wallets for insert with check (user_id = auth.uid());

drop policy if exists "Users can update own wallets" on blockchain_lab_wallets;
create policy "Users can update own wallets" on blockchain_lab_wallets for update using (user_id = auth.uid());

drop policy if exists "Users can delete own wallets" on blockchain_lab_wallets;
create policy "Users can delete own wallets" on blockchain_lab_wallets for delete using (user_id = auth.uid());

-- RLS Policies for blockchain_lab_balances
drop policy if exists "Users can view own balances" on blockchain_lab_balances;
create policy "Users can view own balances" on blockchain_lab_balances for select 
  using (wallet_id in (select id from blockchain_lab_wallets where user_id = auth.uid()));

-- RLS Policies for blockchain_lab_blocks
drop policy if exists "Users can view own blocks" on blockchain_lab_blocks;
create policy "Users can view own blocks" on blockchain_lab_blocks for select using (user_id = auth.uid());

drop policy if exists "Users can create own blocks" on blockchain_lab_blocks;
create policy "Users can create own blocks" on blockchain_lab_blocks for insert with check (user_id = auth.uid());

-- RLS Policies for blockchain_lab_transactions
drop policy if exists "Users can view own transactions" on blockchain_lab_transactions;
create policy "Users can view own transactions" on blockchain_lab_transactions for select using (user_id = auth.uid());

drop policy if exists "Users can create own transactions" on blockchain_lab_transactions;
create policy "Users can create own transactions" on blockchain_lab_transactions for insert with check (user_id = auth.uid());

-- RLS Policies for blockchain_lab_lessons
drop policy if exists "Anyone can view lessons" on blockchain_lab_lessons;
create policy "Anyone can view lessons" on blockchain_lab_lessons for select using (true);

-- RLS Policies for blockchain_lab_progress
drop policy if exists "Users can view own progress" on blockchain_lab_progress;
create policy "Users can view own progress" on blockchain_lab_progress for select using (user_id = auth.uid());

drop policy if exists "Users can update own progress" on blockchain_lab_progress;
create policy "Users can update own progress" on blockchain_lab_progress for all using (user_id = auth.uid());

-- RLS Policies for blockchain_lab_badges
drop policy if exists "Anyone can view badges" on blockchain_lab_badges;
create policy "Anyone can view badges" on blockchain_lab_badges for select using (true);

-- RLS Policies for blockchain_lab_user_badges
drop policy if exists "Users can view own badges" on blockchain_lab_user_badges;
create policy "Users can view own badges" on blockchain_lab_user_badges for select using (user_id = auth.uid());

drop policy if exists "Users can earn badges" on blockchain_lab_user_badges;
create policy "Users can earn badges" on blockchain_lab_user_badges for insert with check (user_id = auth.uid());

-- RLS Policies for blockchain_lab_public_profiles
drop policy if exists "Users can view own profile" on blockchain_lab_public_profiles;
create policy "Users can view own profile" on blockchain_lab_public_profiles for select using (user_id = auth.uid());

drop policy if exists "Users can update own profile" on blockchain_lab_public_profiles;
create policy "Users can update own profile" on blockchain_lab_public_profiles for all using (user_id = auth.uid());

-- Seed lessons
insert into blockchain_lab_lessons (slug, title, description, difficulty, order_index) values
  ('wallet-basics', 'Wallet Basics', 'Learn what a crypto wallet is and how it works', 'beginner', 1),
  ('stablecoin-transfer', 'Stablecoin Transfer', 'Send fake USDC to another wallet', 'beginner', 2),
  ('block-confirmations', 'Block Confirmations', 'Understand how transactions get confirmed', 'beginner', 3),
  ('block-explorer-basics', 'Block Explorer Basics', 'Search and explore blockchain data', 'beginner', 4)
on conflict (slug) do nothing;

-- Seed badges
insert into blockchain_lab_badges (slug, title, description, icon) values
  ('first-wallet', 'First Wallet', 'Created your first simulated wallet', 'wallet'),
  ('first-transfer', 'First Transfer', 'Completed your first transaction', 'send'),
  ('block-explorer', 'Block Explorer', 'Used the block explorer', 'search'),
  ('stablecoin-basics', 'Stablecoin Basics', 'Learned about stablecoins', 'coin'),
  ('blockchain-beginner', 'Blockchain Beginner', 'Completed all beginner lessons', 'graduation')
on conflict (slug) do nothing;