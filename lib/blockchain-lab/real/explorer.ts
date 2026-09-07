import { TcodeError } from '@/lib/tcode/crypto'
import {
  getBalanceLamports,
  getBlock,
  getBlockHeight,
  getSlot,
  getTransaction,
  rpcCall,
} from './rpc'
import { formatUnits, KNOWN_TOKENS, lamportsToSol } from './constants'

export interface LiveBlockView {
  slot: number
  blockhash: string | null
  parentSlot: number | null
  blockTime: number | null
  transactionCount: number
  numRewards: number
}

export interface LiveTxView {
  signature: string
  slot: number
  blockTime: number | null
  success: boolean
  feeSol: number
  signers: string[]
  logSummary: string[]
}

export interface LiveAddressView {
  address: string
  sol: number
  solRaw: string
  tokenHolds: { symbol: string; mint: string; amount: number; decimals: number }[]
}

export interface LiveExplorerResult {
  type: 'block' | 'transaction' | 'address' | 'height'
  data: LiveBlockView | LiveTxView | LiveAddressView | { height: number }
}

export async function getLatestBlocks(count = 8): Promise<LiveBlockView[]> {
  const slot = await getSlot()
  const blocks: LiveBlockView[] = []
  for (let s = slot; s > slot - count && s > 0; s--) {
    const block = await getBlock(s).catch(() => null)
    blocks.push({
      slot: s,
      blockhash: block?.blockhash || null,
      parentSlot: block?.parentSlot ?? null,
      blockTime: block?.blockTime ?? null,
      transactionCount: block?.transactions?.length ?? 0,
      numRewards: block?.rewards?.length ?? 0,
    })
  }
  return blocks
}

export async function getLiveBlockView(slot: number): Promise<LiveBlockView> {
  const block = await getBlock(slot)
  if (!block) throw new TcodeError(404, 'not_found', 'Block not found')
  return {
    slot,
    blockhash: block.blockhash || null,
    parentSlot: block.parentSlot ?? null,
    blockTime: block.blockTime ?? null,
    transactionCount: block.transactions?.length ?? 0,
    numRewards: block.rewards?.length ?? 0,
  }
}

export async function getLiveTxView(signature: string): Promise<LiveTxView> {
  if (!/^[a-zA-Z0-9]{80,90}$/.test(signature)) {
    throw new TcodeError(400, 'invalid_signature', 'Not a valid Solana transaction signature')
  }
  const tx = await getTransaction(signature)
  if (!tx) throw new TcodeError(404, 'not_found', 'Transaction not found')

  const meta = tx.meta || {}
  const message = tx.transaction?.message || {}
  const keys = (message.accountKeys || []).map((k: any) =>
    typeof k === 'string' ? k : k.pubkey,
  )
  const numRequired = message.header?.numRequiredSignatures ?? 1
  const logs = (meta.logMessages || []).slice(0, 5)

  return {
    signature: tx.transaction.signatures?.[0] || signature,
    slot: tx.slot ?? 0,
    blockTime: tx.blockTime ?? null,
    success: meta.err == null,
    feeSol: lamportsToSol(meta.fee || 0),
    signers: keys.slice(0, numRequired),
    logSummary: logs,
  }
}

export async function getLiveAddressView(address: string): Promise<LiveAddressView> {
  const lamports = await getBalanceLamports(address)
  const tokenAccounts = await getTokenAccounts(address)
  const tokenHolds = tokenAccounts
    .filter((a) => Number(a.amount) > 0)
    .map((a) => ({
      symbol: KNOWN_TOKENS[a.mint]?.symbol || a.mint.slice(0, 4).toUpperCase(),
      mint: a.mint,
      amount: Number(formatUnits(a.amount, a.decimals)),
      decimals: a.decimals,
    }))

  return {
    address,
    sol: lamportsToSol(lamports),
    solRaw: String(lamports),
    tokenHolds,
  }
}

export async function searchLiveExplorer(query: string): Promise<LiveExplorerResult | null> {
  const q = String(query || '').trim()
  if (!q) {
    const height = await getBlockHeight()
    return { type: 'height', data: { height } }
  }

  if (/^\d{1,12}$/.test(q)) {
    const slot = Number(q)
    try {
      const block = await getLiveBlockView(slot)
      return { type: 'block', data: block }
    } catch {
      return null
    }
  }

  if (/^[a-zA-Z0-9]{80,90}$/.test(q)) {
    try {
      const tx = await getLiveTxView(q)
      return { type: 'transaction', data: tx }
    } catch {
      return null
    }
  }

  if (q.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(q)) {
    try {
      const address = await getLiveAddressView(q)
      return { type: 'address', data: address }
    } catch {
      return null
    }
  }

  return null
}