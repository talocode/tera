'use client';

import React from 'react';

export default function PublicProofPreview() {
  return (
    <div className="tera-card-subtle flex items-center gap-4 p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/20">
        <svg className="h-6 w-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      </div>
      <div>
        <h4 className="font-semibold text-tera-primary">Coming Soon</h4>
        <p className="text-sm text-tera-secondary">Public proof profile</p>
      </div>
    </div>
  );
}