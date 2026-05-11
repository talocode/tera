'use client';

import React from 'react';

interface TransactionTimelineProps {
  status: 'pending' | 'confirmed';
}

const steps = [
  { key: 'created', label: 'Created', icon: 'plus' },
  { key: 'pending', label: 'Pending', icon: 'clock' },
  { key: 'confirmed', label: 'Confirmed', icon: 'check' },
  { key: 'block', label: 'Added to Block', icon: 'cube' },
];

export default function TransactionTimeline({ status }: TransactionTimelineProps) {
  const statusOrder = { created: 0, pending: 1, confirmed: 2, block: 3 };
  const currentStep = status === 'pending' ? 1 : 2;

  return (
    <div className="tera-card">
      <h4 className="font-semibold text-tera-primary">Transaction Status</h4>
      <div className="mt-6 flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500/20 text-green-500'
                      : 'border-tera-border bg-tera-muted text-tera-secondary'
                  }`}
                >
                  {step.icon === 'plus' && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                  {step.icon === 'clock' && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                  {step.icon === 'check' && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {step.icon === 'cube' && (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs ${isCompleted ? 'text-tera-primary' : 'text-tera-secondary'}`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    index < currentStep ? 'bg-green-500' : 'bg-tera-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}