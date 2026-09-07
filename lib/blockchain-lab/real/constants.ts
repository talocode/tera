export const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111'
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
export const TCODE_MINT = '6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory'

export const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number; name: string }> = {
  [USDC_MINT]: { symbol: 'USDC', decimals: 6, name: 'USD Coin' },
  [TCODE_MINT]: { symbol: 'TCODE', decimals: 6, name: 'Tera Code Token' },
}

export const SOL_DECIMALS = 9

export function lamportsToSol(lamports: bigint | number | string): number {
  return Number(BigInt(lamports || 0)) / 10 ** SOL_DECIMALS
}

export function formatUnits(raw: bigint | number | string, decimals: number): number {
  return Number(BigInt(raw || 0)) / 10 ** Number(decimals || 0)
}

export function makeExplorerUrl(kind: 'tx' | 'address' | 'block', value: string | number): string {
  const v = String(value)
  switch (kind) {
    case 'tx':
      return `https://solscan.io/tx/${v}`
    case 'address':
      return `https://solscan.io/account/${v}`
    case 'block':
      return `https://solscan.io/block/${v}`
  }
}

export function shortKey(address: string, head = 4, tail = 4): string {
  if (!address) return ''
  if (address.length <= head + tail + 3) return address
  return `${address.slice(0, head)}...${address.slice(-tail)}`
}