'use client';

import React, { useState } from 'react';

interface ConceptCheckpointProps {
  question: string;
  answer: string;
}

export default function ConceptCheckpoint({ question, answer }: ConceptCheckpointProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="tera-card border-tera-accent/30">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tera-accent/20">
          <svg className="h-5 w-5 text-tera-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-tera-primary">Checkpoint</h4>
          <p className="mt-2 text-sm text-tera-secondary">{question}</p>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="mt-3 text-sm font-medium text-tera-accent hover:underline"
          >
            {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
          </button>
          {showAnswer && (
            <div className="mt-3 rounded-lg bg-green-500/10 p-3">
              <p className="text-sm text-green-400">{answer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}