'use client';

import React, { useEffect, useState } from 'react';
import { makeExplorerUrl } from '@/lib/blockchain-lab/real/constants';

interface PrepareResponse {
  from: string;
  to: string;
  amountSol: number;
  lamports: string;
  blockhash: string;
  transactionBase64: string;
}

interface WalletApi {
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  signAndSendTransaction?(transaction: Uint8Array, options?: { skipPreflight?: boolean }): Promise<{ signature: string }>;
  sendTransaction?(
    transaction: Uint8Array,
    connection?: unknown,
    options?: { skipPreflight?: boolean },
  ): Promise<string>;
  signTransaction?(transaction: Uint8Array): Promise<{ transaction: Uint8Array }>;
  signMessage(message: Uint8Array, display?: 'utf8' | 'hex'): Promise<{ signature: Uint8Array }>;
  publicKey: { toString(): string } | null;
  on(event: string, handler: (args?: any) => void): void;
}

declare global {
  interface Window {
    solana?: WalletApi;
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function SolanaSend() {
  const [from, setFrom] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sentSignature, setSentSignature] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana?.publicKey) {
      setFrom(window.solana.publicKey.toString());
      setWalletConnected(true);
    }
  }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSentSignature(null);
    if (!window.solana) {
      setError('No browser wallet detected.');
      return;
    }
    if (!window.solana.publicKey) {
      await window.solana.connect();
      setFrom(window.solana.publicKey.toString());
      setWalletConnected(true);
    }
    setBusy(true);
    try {
      const prepareRes = await fetch('/api/blockchain-lab/real/send/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), amount: Number(amount) }),
      });
      const prepared = await prepareRes.json();
      if (!prepareRes.ok) throw new Error(prepared.error || 'Could not prepare transfer.');
      if (prepared.transactionBase64) {
        const txBytes = base64ToBytes(prepared.transactionBase64);
        if (window.solana.signAndSendTransaction) {
          const { signature } = await window.solana.signAndSendTransaction(txBytes, { skipPreflight: false });
          await confirm(signature);
        } else if (window.solana.sendTransaction) {
          const signature = await window.solana.sendTransaction(txBytes, undefined, { skipPreflight: false });
          await confirm(signature);
        } else {
          throw new Error('Your wallet does not support signing send requests.');
        }
      } else {
        await confirm(prepared.signature || prepared.txHash);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm(signature: string) {
    setNotice('Transaction submitted. Confirming on the Solana network...');
    const res = await fetch('/api/blockchain-lab/real/send/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not confirm transaction.');
    if (data.success) {
      setNotice('Confirmed on-chain. Opening in Solscan...');
      setSentSignature(signature);
      setTo('');
      setAmount('');
    } else {
      setError('Transaction was included but failed on-chain.');
    }
  }

  return (
    <div className="rounded-xl border border-tera-border bg-tera-panel p-6">
      <h3 className="text-lg font-semibold text-tera-primary">Send real SOL</h3>
      <p className="mt-1 text-sm text-tera-secondary">
        Sends real SOL from your linked wallet using your own browser wallet. You approve the transfer in your wallet
        before it is broadcast.
      </p>

      {from && (
        <p className="mt-3 font-mono text-xs text-tera-secondary">
          From: {from.slice(0, 6)}...{from.slice(-6)}
        </p>
      )}

      <form onSubmit={send} className="mt-4 space-y-3">
        <input
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="Recipient Solana address (44 chars)"
          className="w-full rounded-lg border border-tera-border bg-tera-elevated px-4 py-2 text-sm font-mono text-tera-primary outline-none focus:border-tera-accent"
        />
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          type="number"
          min="0"
          step="0.000000001"
          placeholder="Amount in SOL"
          className="w-full rounded-lg border border-tera-border bg-tera-elevated px-4 py-2 text-sm text-tera-primary outline-none focus:border-tera-accent"
        />
        <button type="submit" className="tera-button-primary" disabled={busy}>
          {busy ? 'Sending...' : 'Send in my wallet'}
        </button>
      </form>

      {notice && <p className="mt-3 text-sm text-emerald-400">{notice}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {sentSignature && (
        <a
          href={makeExplorerUrl('tx', sentSignature)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-tera-accent hover:underline"
        >
          View transaction on Solscan
        </a>
      )}
    </div>
  );
}