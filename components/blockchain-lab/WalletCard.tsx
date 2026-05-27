'use client';

import React, { useState } from 'react';
import { generateFakePrivateKeyPreview } from '@/lib/blockchain-lab/wallet';

interface Balance {
  token_symbol: string;
  amount: number;
}

interface Wallet {
  id: string;
  label: string;
  address: string;
  network: string;
  created_at: string;
  balances?: Balance[];
}

interface WalletCardProps {
  wallet: Wallet;
}

const tokenColors: Record<string, string> = {
  USDC: 'bg-blue-500/20 text-blue-400',
  ETH: 'bg-purple-500/20 text-purple-400',
  TERA: 'bg-amber-500/20 text-amber-400',
};

export default function WalletCard({ wallet }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const balances = wallet.balances || [];

  return (
    <div className="tera-card">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-tera-primary">{wallet.label}</h4>
          <p className="text-xs text-tera-secondary">{wallet.network}</p>
        </div>
        <button
          onClick={() => setShowKey(!showKey)}
          className="tera-button-ghost text-xs"
        >
          {showKey ? 'Hide Key' : 'Show Key'}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-tera-muted px-3 py-2">
        <code className="flex-1 truncate text-xs text-tera-secondary">{wallet.address}</code>
        <button onClick={handleCopy} className="text-tera-secondary hover:text-tera-primary">
          {copied ? (
            <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {showKey && (
        <div className="mt-3 rounded-lg bg-red-500/10 p-3">
          <p className="text-xs text-red-400">{generateFakePrivateKeyPreview()}</p>
          <p className="mt-2 text-xs text-tera-secondary">
            This is a fake educational key. Never use in real wallets.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {balances.map((balance) => (
          <span
            key={balance.token_symbol}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tokenColors[balance.token_symbol] || 'bg-gray-500/20 text-gray-400'}`}
          >
            <span>{balance.token_symbol}</span>
            <span className="font-mono">{balance.amount.toFixed(2)}</span>
          </span>
        ))}
        {balances.length === 0 && (
          <span className="text-sm text-tera-secondary">No balances</span>
        )}
      </div>
    </div>
  );
}