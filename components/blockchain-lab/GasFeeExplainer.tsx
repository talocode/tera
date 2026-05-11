'use client';

import React from 'react';

interface GasFeeExplainerProps {
  fee: number;
  token: string;
}

export default function GasFeeExplainer({ fee, token }: GasFeeExplainerProps) {
  return (
    <div className="rounded-lg bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
        <div>
          <h4 className="font-medium text-amber-400">Gas Fee Explained</h4>
          <p className="mt-1 text-sm text-tera-secondary">
            You paid <span className="font-mono font-medium text-tera-primary">{fee} {token}</span> as a simulated gas fee.
          </p>
          <p className="mt-2 text-sm text-tera-secondary">
            In real blockchains, gas fees pay for the computational work needed to process your transaction. This keeps the network secure and running.
          </p>
        </div>
      </div>
    </div>
  );
}