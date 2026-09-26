'use client';

import React, { useEffect, useState } from 'react';

interface TcodeConfig {
  token: string;
  mint: string;
  chain: string;
  link: string;
  tiers: { key: string; minTCODE: number; monthlyCredits: number }[];
  jupiterTokenUrl: string;
}

interface Holdings {
  walletAddress: string;
  rawBalance: string;
  decimals: number;
  tcodeTokens: number;
  tier: { key: string; minTCODE: number; monthlyCredits: number } | null;
  period: string;
  claimedThisPeriod: boolean;
  linkedAt: string | null;
}

interface WalletApi {
  connect(options?: { onlyIfTrusted?: boolean; redirectTo?: string }): Promise<{ publicKey: { toString(): string } }>;
  signMessage(message: Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array }>;
  disconnect?(): Promise<void>;
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

export default function TcodeHoldToEarn() {
  const [config, setConfig] = useState<TcodeConfig | null>(null);
  const [providerAvailable, setProviderAvailable] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<Holdings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana) {
      setProviderAvailable(true);
      if (window.solana.publicKey) setWalletAddress(window.solana.publicKey.toString());
    } else {
      setProviderAvailable(false);
    }
    fetch('/api/tcode')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (walletAddress) fetchHoldings();
  }, [walletAddress]);

  async function fetchHoldings() {
    try {
      const res = await fetch('/api/tcode/holdings');
      const data = await res.json();
      if (data.ok) setHoldings(data);
      else if (data.error) setError(data.error);
    } catch {
      setError(null);
    }
  }

  async function connectWallet() {
    if (!window.solana) {
      setError('No browser wallet detected. Install a Solana wallet extension and reload.');
      return;
    }
    try {
      const { publicKey } = await window.solana.connect();
      setWalletAddress(publicKey.toString());
      setError(null);
      setMessage('Connected. Sign the challenge to link your wallet to your Tera account.');
      await fetchHoldings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection was rejected.');
    }
  }

  async function linkWallet() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!window.solana) throw new Error('No browser wallet detected.');
      const challengeRes = await fetch('/api/tcode/challenge', { method: 'POST' });
      const challenge = await challengeRes.json();
      if (!challenge.ok) throw new Error(challenge.error || 'Could not create challenge.');

      // Phantom takes bytes here, not a string. Handing it the challenge text made
      // it throw "Expected Uint8Array". TextEncoder produces the same bytes the
      // server rebuilds with Buffer.from(message, 'utf8'), so the signature verifies.
      const signed = await window.solana.signMessage(new TextEncoder().encode(challenge.message), 'utf8');
      const signatureBase64 = bytesToBase64(signed.signature);

      const linkRes = await fetch('/api/tcode/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature: signatureBase64, nonce: challenge.nonce }),
      });
      const linked = await linkRes.json();
      if (!linked.ok) throw new Error(linked.error || 'Wallet link failed.');
      setMessage('Wallet linked. You earn $TCODE credits every month you hold.');
      await fetchHoldings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not link wallet.');
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/tcode/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Claim failed.');
      if (data.reason === 'already_claimed') {
        setMessage(`You already claimed ${data.tier?.monthlyCredits || 0} credits this month.`);
      } else if (data.reason === 'below_tier') {
        setError('Hold at least 1 $TCODE to claim. See tiers below.');
      } else {
        setMessage(`Claimed ${data.granted} credits into your Tera balance.`);
      }
      await fetchHoldings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim credits.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-tera-border bg-tera-panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-tera-primary">Hold $TCODE, earn monthly credits</h3>
          <p className="mt-1 text-sm text-tera-secondary">
            Link your Solana wallet once. Every UTC month, your $TCODE balance on-chain unlocks a credit grant into
            your Tera balance. No tokens are moved.{' '}
            <a href="https://talocode.site/tcode.html" className="text-tera-accent underline" target="_blank" rel="noopener noreferrer">
              Official mint
            </a>
          </p>
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-tera-secondary">Loading...</p>}

      {providerAvailable === false && (
        <div className="mt-4 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          No browser wallet detected. Install a Solana wallet extension (Phantom, Backpack, or Solflare), then reload
          to connect.
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {config?.tiers?.map((tier) => (
          <div key={tier.key} className="rounded-lg border border-tera-border bg-tera-elevated p-4">
            <p className="capitalize font-medium text-tera-primary">{tier.key}</p>
            <p className="mt-1 text-sm text-tera-secondary">
              Hold {tier.minTCODE.toLocaleString()}+ $TCODE
            </p>
            <p className="mt-2 text-tera-accent">{tier.monthlyCredits.toLocaleString()} credits / month</p>
          </div>
        ))}
      </div>

      {walletAddress && holdings && (
        <div className="mt-4 rounded-lg border border-tera-border bg-tera-elevated p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-tera-secondary">Linked wallet</p>
              <p className="font-mono text-sm text-tera-primary">
                {holdings.walletAddress.slice(0, 6)}...{holdings.walletAddress.slice(-6)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-tera-secondary">$TCODE held on-chain</p>
              <p className="font-mono text-sm text-tera-primary">
                {holdings.tcodeTokens.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-tera-secondary">Current tier</p>
              <p className="text-sm text-tera-primary">
                {holdings.tier ? `${holdings.tier.key} (${holdings.tier.monthlyCredits.toLocaleString()} cr/mo)` : 'Below explorer tier'}
              </p>
            </div>
          </div>
          {holdings.claimedThisPeriod ? (
            <p className="mt-3 text-sm text-emerald-400">
              Monthly credits already claimed for {holdings.period}.
            </p>
          ) : (
            holdings.tier && (
              <button type="button" onClick={claim} disabled={busy} className="tera-button-primary mt-3">
                {busy ? 'Claiming...' : `Claim ${holdings.tier.monthlyCredits.toLocaleString()} credits`}
              </button>
            )
          )}
        </div>
      )}

      {!walletAddress && providerAvailable === true && (
        <button type="button" onClick={connectWallet} className="tera-button-primary mt-4">
          Connect Solana wallet
        </button>
      )}

      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {config?.jupiterTokenUrl && (
        <a
          href={config.jupiterTokenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tera-button-secondary mt-4 inline-block"
        >
          Buy $TCODE on Jupiter
        </a>
      )}

      <p className="mt-4 text-xs text-tera-secondary">{config?.link || ''}</p>
    </div>
  );
}