import { TcodeError } from '@/lib/tcode/crypto'
import { getLink } from '@/lib/tcode/store'
import {
  getBalanceLamports,
  getSignaturesForAddress,
  getTokenAccounts,
  getTransaction,
  TokenAccountInfo,
} from './rpc'
import { formatUnits, KNOWN_TOKENS, lamportsToSol, SOL_DECIMALS } from './constants'

export interface TokenBalanceView {
  symbol: string
  name: string
  mint: string
  amount: number
  decimals: number
  raw: string
  isKnown: boolean
}

export interface WalletBalanceView {
  walletAddress: string
  linkedAt: string | null
  sol: number
  solRaw: string
  tokens: TokenBalanceView[]
  tcode?: TokenBalanceView
}

export async function resolveLinkedWallet(userId: string): Promise<{ walletAddress: string; linkedAt: string | null }> {
  const link = await getLink(userId)
  if (!link) {
    throw new TcodeError(404, 'not_found', 'No linked wallet. Connect your Solana wallet first.')
  }
  return { walletAddress: link.walletAddress, linkedAt: link.linkedAt }
}

export async function getLiveWalletView(userId: string): Promise<WalletBalanceView> {
  const { walletAddress, linkedAt } = await resolveLinkedWallet(userId)

  const lamports = await getBalanceLamports(walletAddress)
  const tokenAccounts = await getTokenAccounts(walletAddress)

  const tokens: TokenBalanceView[] = tokenAccounts
    .filter((a) => Number(a.amount) > 0)
    .map((a) => {
      const known = KNOWN_TOKENS[a.mint]
      return {
        symbol: known?.symbol || a.mint.slice(0, 4).toUpperCase(),
        name: known?.name || 'Unknown token',
        mint: a.mint,
        amount: formatUnits(a.amount, a.decimals),
        decimals: a.decimals,
        raw: a.amount,
        isKnown: Boolean(known),
      }
    })
    .sort((a, b) => (a.isKnown ? -1 : 1) - (b.isKnown ? -1 : 1))

  return {
    walletAddress,
    linkedAt,
    sol: lamportsToSol(lamports),
    solRaw: String(lamports),
    tokens,
    tcode: tokens.find((t) => t.symbol === 'TCODE'),
  }
}

export interface ParsedTransaction {
  signature: string
  slot: number
  blockTime: number | null
  success: boolean
  feeSol: number
  signers: string[]
  tokenTransfers: {
    mint: string
    symbol: string
    from: string
    to: string
    amount: number
    decimals: number
  }[]
  solTransfers: {
    from: string
    to: string
    lamports: number
  }[]
}

function parseTokenTransfers(tx: any): ParsedTransaction['tokenTransfers'] {
  const tokenTransfers: ParsedTransaction['tokenTransfers'] = []
  const meta = tx?.meta
  if (!meta?.preTokenBalances && !meta?.postTokenBalances) return tokenTransfers

  const preByOwnerMint = new Map<string, TokenAccountInfo>()
  const postByOwnerMint = new Map<string, TokenAccountInfo>()

  const key = (b: any) => `${b.owner || ''}:${b.mint || ''}`
  const toRecord = (b: any): TokenAccountInfo => ({
    mint: b.mint,
    owner: b.owner,
    amount: b.uiTokenAmount?.amount ?? '0',
    decimals: b.uiTokenAmount?.decimals ?? 0,
    state: b.uiTokenAmount?.state ?? 'initialized',
  })

  for (const b of meta.preTokenBalances || []) preByOwnerMint.set(key(b), toRecord(b))
  for (const b of meta.postTokenBalances || []) postByOwnerMint.set(key(b), toRecord(b))

  for (const mint of new Set([...preByOwnerMint.keys(), ...postByOwnerMint.keys()])) {
    const after = postByOwnerMint.get(mint)
    const before = preByOwnerMint.get(mint)
    if (!after) continue

    const preAmount = BigInt(before?.amount || '0')
    const postAmount = BigInt(after.amount)
    if (preAmount === postAmount && after.owner) continue

    const known = KNOWN_TOKENS[after.mint]
    const symbol = known?.symbol || after.mint.slice(0, 4).toUpperCase()
    const decimals = after.decimals

    if (after.owner) {
      const delta = postAmount - preAmount
      if (delta > 0n) {
        tokenTransfers.push({
          mint: after.mint,
          symbol,
          from: '(chain)',
          to: after.owner,
          amount: Number(delta) / 10 ** decimals,
          decimals,
        })
      } else if (delta < 0n) {
        tokenTransfers.push({
          mint: after.mint,
          symbol,
          from: after.owner,
          to: '(chain)',
          amount: Number(-delta) / 10 ** decimals,
          decimals,
        })
      }
    }
  }

  return tokenTransfers
}

function parseSolTransfers(tx: any): ParsedTransaction['solTransfers'] {
  const solTransfers: ParsedTransaction['solTransfers'] = []
  const meta = tx?.meta
  const message = tx?.transaction?.message
  if (!meta?.preBalances || !meta?.postBalances || !message?.accountKeys) return solTransfers

  const keys = message.accountKeys.map((k: any) => (typeof k === 'string' ? k : k.pubkey))
  for (let i = 0; i < keys.length; i++) {
    const pre = Number(meta.preBalances[i] || 0)
    const post = Number(meta.postBalances[i] || 0)
    const delta = post - pre
    if (delta > 0) {
      solTransfers.push({ from: '(chain)', to: keys[i], lamports: delta })
    } else if (delta < 0) {
      solTransfers.push({ from: keys[i], to: '(chain)', lamports: -delta })
    }
  }
  return solTransfers
}

export async function getParsedTransactionList(
  userId: string,
  limit = 20,
): Promise<ParsedTransaction[]> {
  const { walletAddress } = await resolveLinkedWallet(userId)
  const signatures = await getSignaturesForAddress(walletAddress, limit)
  if (!signatures?.length) return []

  const rows = await Promise.all(
    signatures.map((sig) =>
      getTransaction(sig.signature)
        .catch(() => null),
    ),
  )

  const parsed: ParsedTransaction[] = []
  rows.forEach((tx: any, i) => {
    if (!tx || !tx.transaction?.signatures?.[0]) return
    const signature = tx.transaction.signatures[0]
    const meta = tx.meta || {}
    const keys: { pubkey: string; signer?: boolean; writable?: boolean }[] =
      tx.transaction.message.accountKeys.map((k: any) =>
        typeof k === 'string' ? { pubkey: k } : k,
      )
    const signers = keys
      .filter((k) => k.signer !== false || k.pubkey === meta.feePayer)
      .map((k) => k.pubkey)
    const signerList = signers.length >= 1 ? signers : keys.slice(0, 1).map((k) => k.pubkey)
    parsed.push({
      signature,
      slot: tx.slot ?? 0,
      blockTime: tx.blockTime ?? null,
      success: meta.err == null,
      feeSol: lamportsToSol(meta.fee || 0),
      signers: signerList,
      tokenTransfers: parseTokenTransfers(tx),
      solTransfers: parseSolTransfers(tx),
    })
  })

  return parsed
}