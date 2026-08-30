export const TCODE_MINT = '6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory'
export const CHALLENGE_TTL_MS = 5 * 60 * 1000
export const TCODE_DECIMALS = 6

export const DEFAULT_SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'

export function getSolanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || DEFAULT_SOLANA_RPC_URL
}

export const JUPITER_TOKEN_URL = `https://jup.ag/tokens/${TCODE_MINT}`

export const TCODE_TIERS = [
  { key: 'explorer', minTCODE: 1, monthlyCredits: 1000 },
  { key: 'builder', minTCODE: 100, monthlyCredits: 10000 },
  { key: 'ecosystem', minTCODE: 1000, monthlyCredits: 100000 },
  { key: 'partner', minTCODE: 5000, monthlyCredits: 500000 },
] as const

export type TcodeTierKey = (typeof TCODE_TIERS)[number]['key']

export function tierFromTokens(tokens: number): (typeof TCODE_TIERS)[number] | null {
  const whole = Math.floor(Number(tokens) || 0)
  return [...TCODE_TIERS].reverse().find((tier) => whole >= tier.minTCODE) || null
}

export function challengeMessage({ userId, nonce, expiresAt }: { userId: string; nonce: string; expiresAt: string }) {
  return ['Tera', `Link wallet to Tera account ${userId}`, `Nonce: ${nonce}`, `Expires: ${expiresAt}`].join('\n')
}

export function tcodePublicConfig() {
  return {
    token: 'TCODE',
    mint: TCODE_MINT,
    chain: 'solana-mainnet',
    period: 'calendar-month-utc',
    link: 'Sign a challenge to prove you own the wallet. One Solana address maps to one Tera account. Claim once per UTC month.',
    tiers: TCODE_TIERS.map((tier) => ({
      key: tier.key,
      minTCODE: tier.minTCODE,
      monthlyCredits: tier.monthlyCredits,
    })),
    jupiterTokenUrl: JUPITER_TOKEN_URL,
  }
}