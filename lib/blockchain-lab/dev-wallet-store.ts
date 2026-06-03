type DevWalletBalance = {
  token_symbol: string;
  amount: number;
};

type DevWallet = {
  id: string;
  label: string;
  address: string;
  network: string;
  created_at: string;
  balances: DevWalletBalance[];
};

type DevWalletStore = {
  wallets: DevWallet[];
};

declare global {
  // eslint-disable-next-line no-var
  var __teraDevWalletStore: DevWalletStore | undefined;
}

function getStore(): DevWalletStore {
  if (!globalThis.__teraDevWalletStore) {
    globalThis.__teraDevWalletStore = { wallets: [] };
  }

  return globalThis.__teraDevWalletStore;
}

function generateFakeAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '0xTera';

  for (let i = 0; i < 40; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export function getDevWallets() {
  return getStore().wallets;
}

export function createDevWallet(label: string) {
  const store = getStore();
  const wallet: DevWallet = {
    id: crypto.randomUUID(),
    label,
    address: generateFakeAddress(),
    network: 'tera-simnet',
    created_at: new Date().toISOString(),
    balances: [
      { token_symbol: 'USDC', amount: 100 },
      { token_symbol: 'ETH', amount: 1 },
      { token_symbol: 'TERA', amount: 500 },
    ],
  };

  store.wallets = [...store.wallets, wallet];

  return wallet;
}
