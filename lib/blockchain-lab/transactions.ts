import { supabaseServer } from '@/lib/supabase-server';
import type { SimulatedTransaction, SimulatedBlock } from './schemas';
import { GAS_SETTINGS, TokenSymbol } from './constants';
import { getWalletBalanceByToken, updateBalance } from './wallet';

export function generateFakeTxHash(): string {
  const chars = 'abcdef0123456789';
  let result = '0x';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function calculateFakeGasFee(token: TokenSymbol): number {
  switch (token) {
    case 'USDC':
      return GAS_SETTINGS.USDC_TRANSFER;
    case 'ETH':
      return GAS_SETTINGS.ETH_TRANSFER;
    case 'TERA':
      return GAS_SETTINGS.TERA_TRANSFER;
    default:
      return GAS_SETTINGS.BASE_FEE;
  }
}

export async function createPendingTransaction(
  userId: string,
  fromWalletId: string,
  toWalletId: string,
  token: TokenSymbol,
  amount: number
): Promise<SimulatedTransaction> {
  const gasFee = calculateFakeGasFee(token);

  const balance = await getWalletBalanceByToken(fromWalletId, token);
  if (balance < amount) {
    throw new Error(`Insufficient ${token} balance`);
  }

  if (token !== 'ETH') {
    const ethBalance = await getWalletBalanceByToken(fromWalletId, 'ETH');
    if (ethBalance < gasFee) {
      throw new Error('Insufficient ETH for gas fee');
    }
  }

  const hash = generateFakeTxHash();

  const { data, error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .insert({
      user_id: userId,
      hash,
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      token_symbol: token,
      amount,
      gas_fee: gasFee,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function confirmTransaction(
  txId: string,
  blockId: string
): Promise<SimulatedTransaction> {
  const { data: tx, error: txError } = await supabaseServer
    .from('blockchain_lab_transactions')
    .select('*')
    .eq('id', txId)
    .single();

  if (txError) throw new Error(txError.message);

  const fromBalance = await getWalletBalanceByToken(tx.from_wallet_id, tx.token_symbol);
  const toBalance = await getWalletBalanceByToken(tx.to_wallet_id, tx.token_symbol);

  const newFromBalance = Number(fromBalance) - Number(tx.amount) - Number(tx.gas_fee);
  const newToBalance = Number(toBalance) + Number(tx.amount);

  await Promise.all([
    updateBalance(tx.from_wallet_id, tx.token_symbol, newFromBalance),
    updateBalance(tx.to_wallet_id, tx.token_symbol, newToBalance),
    updateBalance(tx.from_wallet_id, 'ETH', Number(await getWalletBalanceByToken(tx.from_wallet_id, 'ETH')) - Number(tx.gas_fee)),
  ]);

  const { data: updatedTx, error: updateError } = await supabaseServer
    .from('blockchain_lab_transactions')
    .update({
      status: 'confirmed',
      block_id: blockId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', txId)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);
  return updatedTx;
}

export async function failTransaction(
  txId: string,
  reason: string
): Promise<SimulatedTransaction> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .update({
      status: 'failed',
      failure_reason: reason,
    })
    .eq('id', txId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getUserTransactions(
  userId: string
): Promise<SimulatedTransaction[]> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTransactionByHash(
  userId: string,
  hash: string
): Promise<SimulatedTransaction | null> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('hash', hash)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export async function getTransactionById(
  txId: string,
  userId: string
): Promise<SimulatedTransaction | null> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .select('*')
    .eq('id', txId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}