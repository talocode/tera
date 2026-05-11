import { supabaseServer } from '@/lib/supabase-server';

export async function getBlockchainLabTables() {
  return {
    wallets: supabaseServer.from('blockchain_lab_wallets'),
    balances: supabaseServer.from('blockchain_lab_balances'),
    blocks: supabaseServer.from('blockchain_lab_blocks'),
    transactions: supabaseServer.from('blockchain_lab_transactions'),
    lessons: supabaseServer.from('blockchain_lab_lessons'),
    progress: supabaseServer.from('blockchain_lab_progress'),
    badges: supabaseServer.from('blockchain_lab_badges'),
    userBadges: supabaseServer.from('blockchain_lab_user_badges'),
    publicProfiles: supabaseServer.from('blockchain_lab_public_profiles'),
  };
}

export async function ensureBlockchainLabSchema() {
  const tables = await getBlockchainLabTables();
  return tables;
}