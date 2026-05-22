'use client';

import React, { useState, useEffect } from 'react';
import WalletCard from './WalletCard';
import { EDUCATIONAL_COPY } from '@/lib/blockchain-lab/constants';

interface Wallet {
  id: string;
  label: string;
  address: string;
  network: string;
  created_at: string;
  balances: { token_symbol: string; amount: number }[];
}

export default function WalletSimulator() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newWalletLabel, setNewWalletLabel] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    try {
      const res = await fetch('/api/blockchain-lab/wallets');
      const data = await res.json();
      setWallets(data.wallets || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createWallet() {
    if (!newWalletLabel.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/blockchain-lab/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newWalletLabel, createDemo: false }),
      });
      const data = await res.json();
      if (data.wallet) {
        setWallets((prev) => [...prev, data.wallet]);
        setNewWalletLabel('');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setCreating(false);
    }
  }

  async function createDemoWallet() {
    setCreating(true);
    try {
      const res = await fetch('/api/blockchain-lab/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Demo Wallet', createDemo: true }),
      });
      const data = await res.json();
      if (data.wallet) {
        setWallets((prev) => [...prev, data.wallet]);
      }
    } catch (error) {
      console.error('Error creating demo wallet:', error);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tera-border border-t-tera-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Your Wallets</h3>
        <p className="mt-2 text-sm text-tera-secondary">
          Create simulated wallets to practice blockchain transactions safely.
        </p>

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="Wallet name"
            value={newWalletLabel}
            onChange={(e) => setNewWalletLabel(e.target.value)}
            className="tera-input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && createWallet()}
          />
          <button
            onClick={createWallet}
            disabled={creating || !newWalletLabel.trim()}
            className="tera-button-primary"
          >
            {creating ? 'Creating...' : 'Create Wallet'}
          </button>
          <button
            onClick={createDemoWallet}
            disabled={creating}
            className="tera-button-secondary"
          >
            Demo Wallet
          </button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="tera-card-subtle py-8 text-center">
          <p className="text-tera-secondary">No wallets yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wallets.map((wallet) => (
            <WalletCard key={wallet.id} wallet={wallet} />
          ))}
        </div>
      )}

      <div className="tera-card-subtle mt-6 p-4">
        <h4 className="font-medium text-tera-primary">Safety Notice</h4>
        <ul className="mt-2 space-y-1 text-sm text-tera-secondary">
          {EDUCATIONAL_COPY.WALLET_SAFETY.map((note, i) => (
            <li key={i} className="flex items-center gap-2">
              <svg className="h-4 w-4 text-tera-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}