export const SUPPORTED_TOKENS = ['USDC', 'ETH', 'TERA'] as const;
export type TokenSymbol = typeof SUPPORTED_TOKENS[number];

export const SIM_NETWORK = 'tera-simnet';

export const STARTER_BALANCES: Record<TokenSymbol, number> = {
  USDC: 100,
  ETH: 0.05,
  TERA: 25,
};

export const GAS_SETTINGS = {
  USDC_TRANSFER: 0.001,
  ETH_TRANSFER: 0.002,
  TERA_TRANSFER: 0.001,
  BASE_FEE: 0.0005,
};

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
  HEADLINE: 'Learn blockchain without risking money.',
  SUBHEADLINE:
    'Create wallets, send fake stablecoins, inspect blocks, and understand how money moves onchain through safe AI guided simulations.',
  SAFETY_NOTICE:
    'Everything here is simulated. You are not using real crypto, real wallets, or real private keys.',
  WALLET_SAFETY: [
    'Private keys control wallets',
    'Never share seed phrases',
    'This lab uses fake educational keys only',
    'No real money is involved',
  ],
};