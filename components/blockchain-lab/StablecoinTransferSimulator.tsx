'use client';

import React from 'react';

export default function StablecoinTransferSimulator() {
  return (
    <div className="tera-card-subtle flex items-center gap-4 p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
        <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </svg>
      </div>
      <div>
        <h4 className="font-semibold text-tera-primary">Coming Soon</h4>
        <p className="text-sm text-tera-secondary">Full stablecoin payment simulation</p>
      </div>
    </div>
  );
}