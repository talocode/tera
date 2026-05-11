import { supabaseServer } from '@/lib/supabase-server';
import type { SimulatedWallet, SimulatedBalance } from './schemas';
import { STARTER_BALANCES, TokenSymbol } from './constants';

export async function createSimulatedWallet(
  userId: string,
  label: string
): Promise<{ wallet: SimulatedWallet; balances: SimulatedBalance[] }> {
  const address = generateFakeAddress();

  const { data: wallet, error: walletError } = await supabaseServer
    .from('blockchain_lab_wallets')
    .insert({
      user_id: userId,
      label,
      address,
      network: 'tera-simnet',
    })
    .select()
    .single();

  if (walletError) throw new Error(walletError.message);

  const balances = await createStarterBalances(wallet.id);

  return { wallet, balances };
}

export function generateFakeAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '0xTera';
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateFakePrivateKeyPreview(): string {
  return '0xPreview: This is a fake educational key used only in this simulation. Never use in real wallets.';
}

export async function getWalletBalance(
  walletId: string
): Promise<SimulatedBalance[]> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_balances')
    .select('*')
    .eq('wallet_id', walletId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getUserWalletsWithBalances(
  userId: string
): Promise<(SimulatedWallet & { balances: SimulatedBalance[] })[]> {
  const { data: wallets, error: walletError } = await supabaseServer
    .from('blockchain_lab_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (walletError) throw new Error(walletError.message);
  if (!wallets || wallets.length === 0) return [];

  const walletIds = wallets.map((w) => w.id);

  const { data: balances, error: balanceError } = await supabaseServer
    .from('blockchain_lab_balances')
    .select('*')
    .in('wallet_id', walletIds);

  if (balanceError) throw new Error(balanceError.message);

  return wallets.map((wallet) => ({
    ...wallet,
    balances: balances?.filter((b) => b.wallet_id === wallet.id) || [],
  }));
}

export async function createDemoWallet(
  userId: string
): Promise<SimulatedWallet> {
  const address = generateFakeAddress();

  const { data: wallet, error } = await supabaseServer
    .from('blockchain_lab_wallets')
    .insert({
      user_id: userId,
      label: 'Demo Wallet',
      address,
      network: 'tera-simnet',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await createStarterBalances(wallet.id);

  return wallet;
}

async function createStarterBalances(
  walletId: string
): Promise<SimulatedBalance[]> {
  const balances = (Object.keys(STARTER_BALANCES) as TokenSymbol[]).map(
    (token) => ({
      wallet_id: walletId,
      token_symbol: token,
      amount: STARTER_BALANCES[token],
    })
  );

  const { data, error } = await supabaseServer
    .from('blockchain_lab_balances')
    .insert(balances)
    .select();

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getWalletById(
  walletId: string,
  userId: string
): Promise<SimulatedWallet | null> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_wallets')
    .select('*')
    .eq('id', walletId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export async function renameWallet(
  walletId: string,
  userId: string,
  newLabel: string
): Promise<void> {
  const { error } = await supabaseServer
    .from('blockchain_lab_wallets')
    .update({ label: newLabel })
    .eq('id', walletId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function updateBalance(
  walletId: string,
  tokenSymbol: string,
  amount: number
): Promise<void> {
  const { error } = await supabaseServer
    .from('blockchain_lab_balances')
    .update({
      amount,
      updated_at: new Date().toISOString(),
    })
    .eq('wallet_id', walletId)
    .eq('token_symbol', tokenSymbol);

  if (error) throw new Error(error.message);
}

export async function getWalletBalanceByToken(
  walletId: string,
  tokenSymbol: string
): Promise<number> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_balances')
    .select('amount')
    .eq('wallet_id', walletId)
    .eq('token_symbol', tokenSymbol)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data?.amount || 0;
}