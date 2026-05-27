'use client';

import React, { useState, useEffect } from 'react';
import TransactionTimeline from './TransactionTimeline';
import ConceptCheckpoint from './ConceptCheckpoint';
import type { BlockchainExplanation } from '@/lib/blockchain-lab/schemas';

interface Wallet {
  id: string;
  label: string;
  address: string;
  balances: { token_symbol: string; amount: number }[];
}

const TOKENS = ['USDC', 'ETH', 'TERA'] as const;

export default function TransactionBuilder() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [fromWallet, setFromWallet] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState<typeof TOKENS[number]>('USDC');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed'>('idle');
  const [explanation, setExplanation] = useState<BlockchainExplanation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWallets();
  }, []);

  async function fetchWallets() {
    try {
      const res = await fetch('/api/blockchain-lab/wallets');
      const data = await res.json();
      setWallets(data.wallets || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  }

  async function sendTransaction() {
    if (!fromWallet || !amount || !token) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError('');
    setTxStatus('pending');

    try {
      const res = await fetch('/api/blockchain-lab/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWalletId: fromWallet,
          toWalletId: toAddress || undefined,
          createDemoReceiver: !toAddress,
          amount: parseFloat(amount),
          token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Transaction failed');
      }

      setTxStatus('confirmed');
      setExplanation(data.explanation);
      await fetchWallets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setTxStatus('idle');
    } finally {
      setSending(false);
    }
  }

  const selectedFromWallet = wallets.find((w) => w.id === fromWallet);
  const balance = selectedFromWallet?.balances?.find((b) => b.token_symbol === token);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tera-border border-t-tera-accent" />
      </div>
    );
  }

  if (wallets.length < 2) {
    return (
      <div className="tera-card-subtle py-8 text-center">
        <p className="text-tera-secondary">
          You need at least 2 wallets to send a transaction. Create more wallets first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Send Transaction</h3>
        <p className="mt-2 text-sm text-tera-secondary">
          Transfer fake tokens between your wallets to learn how transactions work.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-tera-primary">From Wallet</label>
            <select
              value={fromWallet}
              onChange={(e) => setFromWallet(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-tera-border bg-tera-input px-4 py-3 text-tera-primary"
            >
              <option value="">Select wallet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label} ({w.address.slice(0, 10)}...)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-tera-primary">To Wallet Address (optional)</label>
            <input
              type="text"
              placeholder="Leave empty to create demo receiver"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="mt-2 w-full tera-input"
            />
            <p className="mt-1 text-xs text-tera-secondary">
              If empty, a demo wallet will be created as receiver
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-tera-primary">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full tera-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-tera-primary">Token</label>
              <select
                value={token}
                onChange={(e) => setToken(e.target.value as typeof TOKENS[number])}
                className="mt-2 block w-full rounded-xl border border-tera-border bg-tera-input px-4 py-3 text-tera-primary"
              >
                {TOKENS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {balance && (
            <div className="rounded-lg bg-tera-muted p-3">
              <p className="text-sm text-tera-secondary">
                Available: <span className="font-mono font-medium text-tera-primary">{balance.amount.toFixed(2)} {token}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
          )}

          <button
            onClick={sendTransaction}
            disabled={sending || !fromWallet || !amount}
            className="tera-button-primary w-full"
          >
            {sending ? 'Sending...' : 'Send Transaction'}
          </button>
        </div>
      </div>

      {txStatus !== 'idle' && <TransactionTimeline status={txStatus} />}

      {explanation && (
        <div className="space-y-4">
          <div className="tera-card">
            <h4 className="font-semibold text-tera-primary">{explanation.title}</h4>
            <p className="mt-2 text-sm text-tera-secondary">{explanation.explanation}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-medium text-tera-primary">Why it matters: </span>
                <span className="text-tera-secondary">{explanation.whyItMatters}</span>
              </div>
              <div>
                <span className="font-medium text-tera-primary">Common mistake: </span>
                <span className="text-tera-secondary">{explanation.commonMistake}</span>
              </div>
              <div>
                <span className="font-medium text-tera-primary">Remember: </span>
                <span className="text-tera-secondary">{explanation.remember}</span>
              </div>
            </div>
          </div>
          <ConceptCheckpoint
            question={explanation.checkpointQuestion}
            answer={explanation.checkpointAnswer}
          />
        </div>
      )}
    </div>
  );
}