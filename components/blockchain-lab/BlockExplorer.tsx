'use client';

import React, { useState, useEffect } from 'react';
import BlockCard from './BlockCard';

interface Block {
  id: string;
  block_number: number;
  block_hash: string;
  previous_block_hash: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  hash: string;
  from_wallet_id: string;
  to_wallet_id: string;
  token_symbol: string;
  amount: number;
  gas_fee: number;
  status: string;
  created_at: string;
}

export default function BlockExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/blockchain-lab/explorer');
      const data = await res.json();
      setBlocks(data.recentBlocks || []);
      setTransactions(data.recentTransactions || []);
    } catch (err) {
      console.error('Error fetching explorer data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchError('');
    try {
      const res = await fetch(`/api/blockchain-lab/explorer?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.result) {
        setSearchResult(data.result);
      } else if (data.error) {
        setSearchError(data.error);
      }
    } catch (err) {
      setSearchError('Search failed');
    } finally {
      setLoading(false);
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
        <h3 className="text-lg font-semibold text-tera-primary">Search</h3>
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            placeholder="Search by address, tx hash, or block number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="tera-input flex-1"
          />
          <button onClick={handleSearch} className="tera-button-primary">
            Search
          </button>
        </div>
        {searchError && <p className="mt-2 text-sm text-red-400">{searchError}</p>}
      </div>

      {searchResult && (
        <div className="tera-card">
          <h4 className="font-semibold text-tera-primary">
            Result: {searchResult.type.charAt(0).toUpperCase() + searchResult.type.slice(1)}
          </h4>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-tera-muted p-3 text-xs text-tera-secondary">
            {JSON.stringify(searchResult.data, null, 2)}
          </pre>
          <button onClick={() => { setSearchResult(null); setSearchQuery(''); }} className="mt-3 text-sm text-tera-secondary hover:text-tera-primary">
            Clear result
          </button>
        </div>
      )}

      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Recent Blocks</h3>
        {blocks.length === 0 ? (
          <p className="mt-4 text-tera-secondary">No blocks yet. Make a transaction to create one.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {blocks.map((block) => (
              <BlockCard key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>

      <div className="tera-card">
        <h3 className="text-lg font-semibold text-tera-primary">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="mt-4 text-tera-secondary">No transactions yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg bg-tera-muted p-3"
              >
                <div>
                  <p className="font-mono text-xs text-tera-secondary">
                    {tx.hash.slice(0, 20)}...
                  </p>
                  <p className="mt-1 text-sm text-tera-primary">
                    {tx.amount} {tx.token_symbol}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    tx.status === 'confirmed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}