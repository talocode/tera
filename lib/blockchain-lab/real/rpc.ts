import { TcodeError } from '@/lib/tcode/crypto'
import { getSolanaRpcUrl } from '@/lib/tcode/config'

export interface RpcResponse<T> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string }
}

export async function rpcCall<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const rpcUrl = getSolanaRpcUrl()
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  })
  if (!response.ok) {
    throw new TcodeError(503, 'rpc_unavailable', 'Could not reach the Solana network')
  }
  const payload = (await response.json()) as RpcResponse<T>
  if (payload.error) {
    throw new TcodeError(503, 'rpc_unavailable', `Solana RPC error: ${payload.error.message}`)
  }
  return payload.result as T
}

export interface TokenAccountInfo {
  mint: string
  owner: string
  amount: string
  decimals: number
  state: string
}

export async function getBalanceLamports(address: string): Promise<number> {
  const result = await rpcCall<number | string>('getBalance', [address])
  return Number(result || 0)
}

export async function getTokenAccounts(owner: string): Promise<TokenAccountInfo[]> {
  const result = await rpcCall<{ value: { pubkey: string; account: { data: { parsed: { info: TokenAccountInfo } } } }[] }>(
    'getTokenAccountsByOwner',
    [owner, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }],
  )
  return (result?.value || [])
    .map((v) => v.account?.data?.parsed?.info)
    .filter(Boolean)
    .map((info) => ({
      mint: info.mint,
      owner: info.owner,
      amount: info.tokenAmount?.amount ?? '0',
      decimals: info.tokenAmount?.decimals ?? 0,
      state: info.state ?? 'initialized',
    }))
}

export async function getSignaturesForAddress(address: string, limit = 25): Promise<any[]> {
  return rpcCall<any[]>('getSignaturesForAddress', [address, { limit, maxSupportedTransactionVersion: 0 }])
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