'use client';

import React, { useEffect, useState } from 'react';

interface LiveBlock {
  slot: number;
  blockhash: string | null;
  parentSlot: number | null;
  blockTime: number | null;
  transactionCount: number;
  numRewards: number;
}

interface LiveTx {
  signature: string;
  slot: number;
  blockTime: number | null;
  success: boolean;
  feeSol: number;
  signers: string[];
  logSummary: string[];
}

interface LiveAddress {
  address: string;
  sol: number;
  solRaw: string;
  tokenHolds: { symbol: string; mint: string; amount: number; decimals: number }[];
}

type Result =
  | { kind: 'block'; block: LiveBlock }
  | { kind: 'transaction'; transaction: LiveTx }
  | { kind: 'address'; address: LiveAddress }
  | null;

export default function LiveBlockExplorer() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<LiveBlock[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRecent() {
    try {
      const res = await fetch('/api/blockchain-lab/real/explorer?recent=1');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load blocks');
      setRecent(data.blocks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recent blocks');
    }
  }

  useEffect(() => {
    loadRecent();
  }, []);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/blockchain-lab/real/explorer?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (data.kind === 'notfound' ? 'Nothing found for that query' : 'Nothing found'));
        return;
      }
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-tera-border bg-tera-panel p-6">
      <h3 className="text-lg font-semibold text-tera-primary">Live Solana explorer</h3>
      <p className="mt-1 text-sm text-tera-secondary">
        Real data from the Solana network. Search a block slot, transaction signature, or wallet address.
      </p>

      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Slot, signature, or address"
          className="w-full rounded-lg border border-tera-border bg-tera-elevated px-4 py-2 text-sm text-tera-primary outline-none focus:border-tera-accent"
        />
        <button type="submit" className="tera-button-primary shrink-0" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result?.kind === 'block' && <BlockView block={result.block} />}
      {result?.kind === 'transaction' && <TxView tx={result.transaction} />}
      {result?.kind === 'address' && <AddressView address={result.address} />}

      {recent.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-tera-primary">Latest live blocks</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((block) => (
              <button
                key={block.slot}
                type="button"
                onClick={() => {
                  setQuery(String(block.slot));
                  setResult({ kind: 'block', block });
                }}
                className="rounded-lg border border-tera-border bg-tera-elevated p-3 text-left transition hover:border-tera-accent/50"
              >
                <p className="font-mono text-sm text-tera-accent">Slot {block.slot.toLocaleString()}</p>
                <p className="mt-1 text-xs text-tera-secondary">{block.transactionCount} transactions</p>
                <p className="text-xs text-tera-secondary">{fmtTime(block.blockTime)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockView({ block }: { block: LiveBlock }) {
  return (
    <div className="mt-4 rounded-lg border border-tera-border bg-tera-elevated p-4">
      <p className="font-mono text-tera-accent">Slot {block.slot.toLocaleString()}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <dt className="text-tera-secondary">Blockhash</dt>
        <dd className="font-mono break-all text-tera-primary">{block.blockhash || '—'}</dd>
        <dt className="text-tera-secondary">Parent slot</dt>
        <dd className="font-mono text-tera-primary">{block.parentSlot?.toLocaleString() || '—'}</dd>
        <dt className="text-tera-secondary">Transactions</dt>
        <dd className="text-tera-primary">{block.transactionCount}</dd>
        <dt className="text-tera-secondary">Time</dt>
        <dd className="text-tera-primary">{fmtTime(block.blockTime)}</dd>
      </dl>
    </div>
  );
}

function TxView({ tx }: { tx: LiveTx }) {
  return (
    <div className="mt-4 rounded-lg border border-tera-border bg-tera-elevated p-4">
      <p className="font-mono break-all text-tera-accent">{tx.signature}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <dt className="text-tera-secondary">Status</dt>
        <dd className={tx.success ? 'text-emerald-400' : 'text-red-400'}>{tx.success ? 'Success' : 'Failed'}</dd>
        <dt className="text-tera-secondary">Slot</dt>
        <dd className="font-mono text-tera-primary">{tx.slot.toLocaleString()}</dd>
        <dt className="text-tera-secondary">Fee</dt>
        <dd className="text-tera-primary">{tx.feeSol.toFixed(6)} SOL</dd>
        <dt className="text-tera-secondary">Signers</dt>
        <dd className="font-mono break-all text-tera-primary">{tx.signers.join(', ')}</dd>
      </dl>
      {tx.logSummary.length > 0 && (
        <div className="mt-3">
          <p className="text-xs uppercase tracking-wide text-tera-secondary">Program logs</p>
          <pre className="mt-1 overflow-x-auto rounded bg-tera-panel p-3 text-xs text-tera-secondary">
            {tx.logSummary.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}

function AddressView({ address }: { address: LiveAddress }) {
  return (
    <div className="mt-4 rounded-lg border border-tera-border bg-tera-elevated p-4">
      <p className="font-mono break-all text-tera-accent">{address.address}</p>
      <p className="mt-2 text-sm text-tera-primary">
        {address.sol.toLocaleString(undefined, { maximumFractionDigits: 6 })} SOL
      </p>
      {address.tokenHolds.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {address.tokenHolds.map((t) => (
            <div key={t.mint} className="rounded border border-tera-border bg-tera-panel px-3 py-2">
              <p className="text-sm font-medium text-tera-primary">{t.symbol}</p>
              <p className="font-mono text-tera-accent">
                {t.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </p>
              <p className="mt-1 truncate text-xs text-tera-secondary">{t.mint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtTime(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}