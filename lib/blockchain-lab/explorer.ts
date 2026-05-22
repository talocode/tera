import { supabaseServer } from '@/lib/supabase-server';
import type { SimulatedWallet, SimulatedTransaction, SimulatedBlock } from './schemas';
import { getUserWalletsWithBalances } from './wallet';
import { getUserTransactions } from './transactions';
import { getUserBlocks, getBlockTransactions } from './blocks';

export interface ExplorerResult {
  type: 'wallet' | 'transaction' | 'block';
  data: SimulatedWallet | SimulatedTransaction | SimulatedBlock;
}

export async function searchExplorer(
  userId: string,
  query: string
): Promise<ExplorerResult | null> {
  const wallets = await getUserWalletsWithBalances(userId);
  const walletMatch = wallets.find((w) => w.address === query || w.id === query);
  if (walletMatch) {
    return { type: 'wallet', data: walletMatch as SimulatedWallet };
  }

  const transactions = await getUserTransactions(userId);
  const txMatch = transactions.find((t) => t.hash === query || t.id === query);
  if (txMatch) {
    return { type: 'transaction', data: txMatch as SimulatedTransaction };
  }

  const blocks = await getUserBlocks(userId, 100);
  const blockMatch = blocks.find((b) => b.blockHash === query || b.id === query || b.blockNumber === Number(query));
  if (blockMatch) {
    return { type: 'block', data: blockMatch as SimulatedBlock };
  }

  return null;
}

export async function getWalletExplorerView(
  userId: string,
  walletId: string
): Promise<{
  wallet: SimulatedWallet;
  balances: { token: string; amount: number }[];
  recentTransactions: SimulatedTransaction[];
} | null> {
  const wallets = await getUserWalletsWithBalances(userId);
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) return null;

  const transactions = await getUserTransactions(userId);
  const recentTransactions = transactions
    .filter((t) => t.fromWalletId === walletId || t.toWalletId === walletId)
    .slice(0, 5) as SimulatedTransaction[];

  return {
    wallet,
    balances: wallet.balances.map((b) => ({
      token: b.tokenSymbol,
      amount: b.amount,
    })),
    recentTransactions,
  };
}

export async function getTransactionExplorerView(
  userId: string,
  txId: string
): Promise<{
  transaction: SimulatedTransaction;
  block?: SimulatedBlock;
  fromWallet?: SimulatedWallet;
  toWallet?: SimulatedWallet;
} | null> {
  const transactions = await getUserTransactions(userId);
  const transaction = transactions.find((t) => t.id === txId);
  if (!transaction) return null;

  let block: SimulatedBlock | undefined;
  if (transaction.blockId) {
    const { data: blockData } = await supabaseServer
      .from('blockchain_lab_blocks')
      .select('*')
      .eq('id', transaction.blockId)
      .single();
    block = blockData as SimulatedBlock | undefined;
  }

  let fromWallet: SimulatedWallet | undefined;
  let toWallet: SimulatedWallet | undefined;

  if (transaction.fromWalletId) {
    const { data: fromData } = await supabaseServer
      .from('blockchain_lab_wallets')
      .select('*')
      .eq('id', transaction.fromWalletId)
      .single();
    fromWallet = fromData as SimulatedWallet | undefined;
  }

  if (transaction.toWalletId) {
    const { data: toData } = await supabaseServer
      .from('blockchain_lab_wallets')
      .select('*')
      .eq('id', transaction.toWalletId)
      .single();
    toWallet = toData as SimulatedWallet | undefined;
  }

  return { transaction, block, fromWallet, toWallet };
}

export async function getBlockExplorerView(
  userId: string,
  blockId: string
): Promise<{
  block: SimulatedBlock;
  transactions: SimulatedTransaction[];
} | null> {
  const block = await getBlockById(userId, blockId);
  if (!block) return null;

  const transactions = await getBlockTransactions(userId, blockId);

  return {
    block,
    transactions: transactions as SimulatedTransaction[],
  };
}

export async function getRecentExplorerActivity(
  userId: string
): Promise<{
  recentBlocks: SimulatedBlock[];
  recentTransactions: SimulatedTransaction[];
  walletCount: number;
}> {
  const [recentBlocks, recentTransactions, wallets] = await Promise.all([
    getUserBlocks(userId, 5),
    getUserTransactions(userId),
    getUserWalletsWithBalances(userId),
  ]);

  return {
    recentBlocks,
    recentTransactions: recentTransactions.slice(0, 10) as SimulatedTransaction[],
    walletCount: wallets.length,
  };
}

async function getBlockById(
  userId: string,
  blockId: string
): Promise<SimulatedBlock | null> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_blocks')
    .select('*')
    .eq('id', blockId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}