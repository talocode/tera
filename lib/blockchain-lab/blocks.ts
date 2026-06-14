import { supabaseServer } from '@/lib/supabase-server';
import type { SimulatedBlock } from './schemas';

export function generateFakeBlockHash(): string {
  const chars = 'abcdef0123456789';
  let result = '0xblock';
  for (let i = 0; i < 56; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createBlock(
  userId: string,
  transactionIds: string[] = []
): Promise<SimulatedBlock> {
  const latestBlock = await getLatestBlock(userId);
  const blockNumber = latestBlock ? latestBlock.blockNumber + 1 : 1;
  const previousBlockHash = latestBlock?.blockHash || null;

  const blockHash = generateFakeBlockHash();

  const { data, error } = await supabaseServer
    .from('blockchain_lab_blocks')
    .insert({
      user_id: userId,
      block_number: blockNumber,
      block_hash: blockHash,
      previous_block_hash: previousBlockHash,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (transactionIds.length > 0) {
    await supabaseServer
      .from('blockchain_lab_transactions')
      .update({ block_id: data.id })
      .in('id', transactionIds);
  }

  return data;
}

export async function attachTransactionToBlock(
  blockId: string,
  txId: string
): Promise<void> {
  const { error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .update({ block_id: blockId })
    .eq('id', txId);

  if (error) throw new Error(error.message);
}

export async function getLatestBlock(
  userId: string
): Promise<SimulatedBlock | null> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_blocks')
    .select('*')
    .eq('user_id', userId)
    .order('block_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export async function getBlockByHash(
  userId: string,
  blockHash: string
): Promise<SimulatedBlock | null> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_blocks')
    .select('*')
    .eq('user_id', userId)
    .eq('block_hash', blockHash)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
}

export async function getBlockById(
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

export async function getUserBlocks(
  userId: string,
  limit = 10
): Promise<SimulatedBlock[]> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_blocks')
    .select('*')
    .eq('user_id', userId)
    .order('block_number', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getBlockTransactions(
  userId: string,
  blockId: string
): Promise<any[]> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('block_id', blockId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}