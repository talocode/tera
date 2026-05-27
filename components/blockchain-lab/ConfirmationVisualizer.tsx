'use client';

import React from 'react';

interface ConfirmationVisualizerProps {
  confirmations: number;
  maxConfirmations?: number;
}

export default function ConfirmationVisualizer({ confirmations, maxConfirmations = 6 }: ConfirmationVisualizerProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxConfirmations }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded-sm ${
            i < confirmations ? 'bg-green-500' : 'bg-tera-border'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-tera-secondary">{confirmations}/{maxConfirmations}</span>
    </div>
  );
}