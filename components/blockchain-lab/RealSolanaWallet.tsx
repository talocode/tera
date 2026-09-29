'use client';

import React, { useEffect, useRef, useState } from 'react';
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

interface SolanaProvider {
  isPhantom?: boolean;
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  signMessage(message: Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array | string } | Uint8Array | string>;
  publicKey: { toString(): string } | null;
  on?(event: string, handler: (args?: any) => void): void;
}

declare global {
  interface Window {
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
    solflare?: SolanaProvider;
    backpack?: SolanaProvider;
  }
}

function injectedProvider(): SolanaProvider | null {
  if (typeof window === 'undefined') return null;
  const candidates = [window.phantom?.solana, window.solflare, window.backpack, window.solana].filter(Boolean) as SolanaProvider[];
  return candidates.find((provider) => provider.isPhantom) || candidates[0] || null;
}

function waitForProvider(ms = 2500): Promise<SolanaProvider | null> {
  const existing = injectedProvider();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const provider = injectedProvider();
      if (provider || Date.now() - started > ms) {
        window.clearInterval(timer);
        resolve(provider);
      }
    }, 200);
  });
}

function signatureToWire(signature: Uint8Array | string | { signature?: Uint8Array | string }): string {
  const raw = signature && typeof signature === 'object' && 'signature' in signature ? signature.signature : signature;
  if (!raw) throw new Error('The wallet did not return a signature.');
  if (typeof raw === 'string') return raw;
  return bytesToBase64(raw);
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
  const providerRef = useRef<SolanaProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    waitForProvider().then((provider) => {
      if (cancelled) return;
      providerRef.current = provider;
      setProvider(provider ? 'yes' : 'no');
      if (provider?.publicKey) setWalletAddress(provider.publicKey.toString());
      provider?.on?.('accountChanged', (next: { toString(): string } | null) => {
        setWalletAddress(next ? next.toString() : null);
      });
    });
    return () => {
      cancelled = true;
    };
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
    const provider = providerRef.current || await waitForProvider(4000);
    providerRef.current = provider;
    if (!provider) {
      setProvider('no');
      setError('No Solana wallet extension found. Install Phantom, Solflare, or Backpack, then reload this page.');
      return;
    }
    setProvider('yes');
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { publicKey } = await provider.connect();
      const address = publicKey.toString();
      setWalletAddress(address);

      const challengeRes = await fetch('/api/tcode/challenge', { method: 'POST' });
      const challenge = await challengeRes.json();
      if (!challengeRes.ok || !challenge.ok) throw new Error(challenge.error || 'Could not create a signing challenge.');

      const message = new TextEncoder().encode(challenge.message);
      let signed: Awaited<ReturnType<SolanaProvider['signMessage']>>;
      try {
        signed = await provider.signMessage(message, 'utf8');
      } catch {
        signed = await provider.signMessage(message);
      }
      const linkRes = await fetch('/api/tcode/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, signature: signatureToWire(signed), nonce: challenge.nonce }),
      });
      const linked = await linkRes.json();
      if (!linkRes.ok || !linked.ok) throw new Error(linked.error || 'Wallet link failed.');

      setNotice('Wallet linked to your Tera account.');
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not connect wallet.';
      setError(message.includes('User rejected') ? 'Connection cancelled in the wallet.' : message);
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
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            No browser wallet detected yet. Install{' '}
            <a className="underline" href="https://phantom.app/download" target="_blank" rel="noopener noreferrer">Phantom</a>,{' '}
            Solflare, or Backpack, then connect.
          </div>
        )}

        {!wallet && (
          <button type="button" onClick={connectAndLink} disabled={busy || loading} className="tera-button-primary mt-4">
            {busy ? 'Connecting...' : loading ? 'Checking wallet...' : 'Connect Solana wallet'}
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