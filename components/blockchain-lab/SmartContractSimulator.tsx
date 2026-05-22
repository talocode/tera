'use client';

import React from 'react';

export default function SmartContractSimulator() {
  return (
    <div className="tera-card-subtle flex items-center gap-4 p-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
        <svg className="h-6 w-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
      <div>
        <h4 className="font-semibold text-tera-primary">Coming Soon</h4>
        <p className="text-sm text-tera-secondary">Smart contract playground</p>
      </div>
    </div>
  );
}