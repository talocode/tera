'use client';

import React, { useEffect, useState } from 'react';
import { makeExplorerUrl, shortKey } from '@/lib/blockchain-lab/real/constants';

interface WalletView {
  walletAddress: string;
  linkedAt: string | null;
  sol: number;
  solRaw: string;
  tokens: { symbol: string; name: string; mint: string; amount: number; decimals: number; isKnown: boolean }[];
  tcode?: { symbol: string; mint: string; amount: number } | undefined;
}

interface ParsedTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  success: boolean;
  feeSol: number;
  signers: string[];
  tokenTransfers: { mint: string; symbol: string; from: string; to: string; amount: number }[];
  solTransfers: { from: string; to: string; lamports: number }[];
}

interface WalletApi {
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  signMessage(message: Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array }>;
  publicKey: { toString(): string } | null;
  on(event: string, handler: (args?: any) => void): void;
}

declare global {
  interface Window {
    solana?: WalletApi;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function formatTokens(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export default function RealSolanaWallet() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<'yes' | 'no' | 'unchecked'>('unchecked');
  const [wallet, setWallet] = useState<WalletView | null>(null);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana) {
      setProvider('yes');
      if (window.solana.publicKey) setWalletAddress(window.solana.publicKey.toString());
    } else {
      setProvider('no');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [walletAddress]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/blockchain-lab/real/wallet');
      if (res.status === 404) {
        setWallet(null);
        setTransactions([]);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Could not load live wallet data');
      }
      const data = await res.json();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load live wallet data');
      setWallet(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function connectAndLink() {
    if (!window.solana) {
      setError('No browser wallet detected. Install a Solana wallet extension and reload.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { publicKey } = await window.solana.connect();
      const address = publicKey.toString();
      setWalletAddress(address);

      const challengeRes = await fetch('/api/tcode/challenge', { method: 'POST' });
      const challenge = await challengeRes.json();
      if (!challenge.ok) throw new Error(challenge.error || 'Could not create a signing challenge.');

      // Phantom takes bytes here, not a string. Handing it the challenge text made
      // it throw "Expected Uint8Array". TextEncoder produces the same bytes the
      // server rebuilds with Buffer.from(message, 'utf8'), so the signature verifies.
      const signed = await window.solana.signMessage(new TextEncoder().encode(challenge.message), 'utf8');
      const linkRes = await fetch('/api/tcode/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature: bytesToBase64(signed.signature), nonce: challenge.nonce }),
      });
      const linked = await linkRes.json();
      if (!linked.ok) throw new Error(linked.error || 'Wallet link failed.');

      setNotice('Wallet linked to your Tera account.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect wallet.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-tera-border bg-tera-panel p-6">
        <h3 className="text-lg font-semibold text-tera-primary">Real Solana wallet</h3>
        <p className="mt-1 text-sm text-tera-secondary">
          Connect your own wallet and read live balances and transactions straight from the Solana network.
        </p>

        {provider === 'no' && (
          <div className="mt-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            No browser wallet detected. Install a Solana wallet extension (Phantom, Backpack, or Solflare) to connect.
          </div>
        )}

        {!walletAddress && provider === 'yes' && (
          <button type="button" onClick={connectAndLink} disabled={busy} className="tera-button-primary mt-4">
            {busy ? 'Connecting...' : 'Connect and link wallet'}
          </button>
        )}

        {notice && <p className="mt-3 text-sm text-emerald-400">{notice}</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {wallet && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-tera-border bg-tera-elevated p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-tera-secondary">Linked wallet</p>
                <p className="font-mono text-sm text-tera-primary">{wallet.walletAddress}</p>
                <a
                  href={makeExplorerUrl('address', wallet.walletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-tera-accent hover:underline"
                >
                  View on Solscan
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-tera-secondary">SOL balance</p>
                <p className="font-mono text-2xl text-tera-primary">
                  {wallet.sol.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
              </div>
            </div>

            {wallet.tokens.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {wallet.tokens.map((token) => (
                  <div key={token.mint} className="rounded-lg border border-tera-border bg-tera-elevated p-3">
                    <p className="text-sm font-medium text-tera-primary">{token.symbol}</p>
                    <p className="font-mono text-tera-accent">{formatTokens(token.amount)}</p>
                    <p className="mt-1 truncate text-xs text-tera-secondary">{token.name}</p>
                  </div>
                ))}
              </div>
            )}

            <a
              href={makeExplorerUrl('address', wallet.walletAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="tera-button-secondary inline-block"
            >
              Full transaction history
            </a>
          </div>
        )}

        {!wallet && !loading && !error && provider !== 'no' && (
          <p className="mt-4 text-sm text-tera-secondary">No linked wallet yet.</p>
        )}
      </div>

      {transactions.length > 0 && (
        <div className="rounded-xl border border-tera-border bg-tera-panel p-6">
          <h4 className="font-semibold text-tera-primary">Recent on-chain activity</h4>
          <div className="mt-3 space-y-2">
            {transactions.map((tx) => {
              const summary = describeTx(tx);
              return (
                <div
                  key={tx.signature}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-tera-border bg-tera-elevated px-4 py-3"
                >
                  <div>
                    <a
                      href={makeExplorerUrl('tx', tx.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-tera-accent hover:underline"
                    >
                      {shortKey(tx.signature, 10, 10)}
                    </a>
                    <p className="mt-1 text-xs text-tera-secondary">{summary}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${tx.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.success ? 'Success' : 'Failed'}
                    </span>
                    <p className="text-xs text-tera-secondary">{fmtDate(tx.blockTime)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && <p className="text-sm text-tera-secondary">Reading live chain data...</p>}
    </div>
  );
}

function describeTx(tx: ParsedTransaction): string {
  if (tx.tokenTransfers.length > 0) {
    const t = tx.tokenTransfers[0];
    return `${formatTokens(t.amount)} ${t.symbol} · ${shortKey(t.from === '(chain)' ? '' : t.from, 4, 4)} ${t.from === '(chain)' ? 'in' : '->'} ${t.to === '(chain)' ? 'in' : shortKey(t.to, 4, 4)}`;
  }
  if (tx.solTransfers.length > 0 && tx.solTransfers[0].lamports > 0) {
    const s = tx.solTransfers[0];
    const amount = (s.lamports / 1e9).toLocaleString(undefined, { maximumFractionDigits: 6 });
    return `${amount} SOL ${s.from === '(chain)' ? 'in' : '->'} ${s.to === '(chain)' ? 'in' : shortKey(s.to, 4, 4)} · fee ${tx.feeSol.toFixed(6)} SOL`;
  }
  return `Contract interaction · fee ${tx.feeSol.toFixed(6)} SOL`;
}

function fmtDate(ts: number | null): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString();
}