export const BADGES = {
  FIRST_WALLET: 'first-wallet',
  FIRST_TRANSFER: 'first-transfer',
  BLOCK_EXPLORER: 'block-explorer',
  STABLECOIN_BASICS: 'stablecoin-basics',
  BLOCKCHAIN_BEGINNER: 'blockchain-beginner',
} as const;

export const LESSONS = {
  WALLET_BASICS: 'wallet-basics',
  STABLECOIN_TRANSFER: 'stablecoin-transfer',
  BLOCK_CONFIRMATIONS: 'block-confirmations',
  BLOCK_EXPLORER_BASICS: 'block-explorer-basics',
} as const;

export const EDUCATIONAL_COPY = {
  HEADLINE: 'Learn blockchain with a real Solana wallet.',
  SUBHEADLINE:
    'Connect your own wallet, track live balances, inspect real blocks, and understand how money moves on-chain.',
  SAFETY_NOTICE:
    'You are connected to the real Solana network with your own wallet. You approve every transaction before it is broadcast.',
  WALLET_SAFETY: [
    'Your keys stay in your wallet',
    'Never share seed phrases',
    'Verify every transaction before signing',
    'Start with small test amounts',
  ],
};