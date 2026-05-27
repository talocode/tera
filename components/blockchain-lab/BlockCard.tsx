'use client';

import React from 'react';

interface Block {
  id: string;
  block_number: number;
  block_hash: string;
  previous_block_hash: string | null;
  created_at: string;
}

interface BlockCardProps {
  block: Block;
}

export default function BlockCard({ block }: BlockCardProps) {
  const formattedDate = new Date(block.created_at).toLocaleString();

  return (
    <div className="rounded-lg border border-tera-border bg-tera-muted p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-tera-primary">Block #{block.block_number}</p>
          <p className="mt-1 font-mono text-xs text-tera-secondary">{block.block_hash.slice(0, 20)}...</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-tera-secondary">{formattedDate}</p>
        </div>
      </div>
      {block.previous_block_hash && (
        <div className="mt-3 border-t border-tera-border pt-3">
          <p className="text-xs text-tera-secondary">
            Previous: <span className="font-mono">{block.previous_block_hash.slice(0, 16)}...</span>
          </p>
        </div>
      )}
    </div>
  );
}