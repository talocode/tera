import { TcodeError } from '@/lib/tcode/crypto'
import { getSolanaRpcUrl } from '@/lib/tcode/config'

export interface RpcResponse<T> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string }
}

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

function rpcUrls(): string[] {
  const urls = [
    getSolanaRpcUrl(),
    'https://api.mainnet-beta.solana.com',
    'https://solana-rpc.publicnode.com',
  ]
  return [...new Set(urls.filter(Boolean))]
}

export async function rpcCall<T = unknown>(method: string, params: unknown[]): Promise<T> {
  let lastError: Error = new TcodeError(503, 'rpc_unavailable', 'Could not reach the Solana network')
  for (const rpcUrl of rpcUrls()) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(12_000),
      })
      if (!response.ok) {
        lastError = new TcodeError(503, 'rpc_unavailable', 'Could not reach the Solana network')
        continue
      }
      const payload = (await response.json()) as RpcResponse<T>
      if (payload.error) {
        lastError = new TcodeError(503, 'rpc_unavailable', `Solana RPC error: ${payload.error.message}`)
        continue
      }
      return payload.result as T
    } catch (error) {
      lastError = error instanceof Error ? error : lastError
    }
  }
  throw lastError
}

export interface TokenAccountInfo {
  mint: string
  owner: string
  amount: string
  decimals: number
  state: string
}

export async function getBalanceLamports(address: string): Promise<number> {
  const result = await rpcCall<{ value?: number | string } | number | string>('getBalance', [address])
  if (typeof result === 'number' || typeof result === 'string') return Number(result || 0)
  return Number(result?.value || 0)
}

async function tokenAccountsForProgram(owner: string, programId: string): Promise<TokenAccountInfo[]> {
  const result = await rpcCall<{ value: { account: { data: { parsed: { info: any } } } }[] }>(
    'getTokenAccountsByOwner',
    [owner, { programId }, { encoding: 'jsonParsed' }],
  )
  return (result?.value || [])
    .map((v) => v.account?.data?.parsed?.info)
    .filter(Boolean)
    .map((info) => ({
      mint: info.mint,
      owner: info.owner,
      amount: info.tokenAmount?.amount ?? info.amount ?? '0',
      decimals: info.tokenAmount?.decimals ?? info.decimals ?? 0,
      state: info.state ?? 'initialized',
    }))
}

export async function getTokenAccounts(owner: string): Promise<TokenAccountInfo[]> {
  const [classic, token2022] = await Promise.all([
    tokenAccountsForProgram(owner, TOKEN_PROGRAM).catch(() => [] as TokenAccountInfo[]),
    tokenAccountsForProgram(owner, TOKEN_2022_PROGRAM).catch(() => [] as TokenAccountInfo[]),
  ])
  const seen = new Set<string>()
  return [...classic, ...token2022].filter((account) => {
    const key = `${account.mint}:${account.owner}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function getSignaturesForAddress(address: string, limit = 25): Promise<any[]> {
  return rpcCall<any[]>('getSignaturesForAddress', [address, { limit }])
}

export async function getTransaction(signature: string): Promise<any | null> {
  return rpcCall<any | null>('getTransaction', [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }])
}

export async function getLatestBlockhash(): Promise<string> {
  const result = await rpcCall<{ value: { blockhash: string } }>('getLatestBlockhash', [])
  return result.value.blockhash
}

export async function getSlot(): Promise<number> {
  return rpcCall<number>('getSlot', [])
}

export async function getBlockHeight(): Promise<number> {
  return rpcCall<number>('getBlockHeight', [])
}

export async function getBlock(slot: number): Promise<any | null> {
  return rpcCall<any | null>('getBlock', [slot, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }])
}
