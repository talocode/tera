'use client';

import React, { useState, useEffect } from 'react';

interface ProgressData {
  completedLessons: number;
  totalLessons: number;
  badges: { badge_slug: string; earned_at: string }[];
  walletCount: number;
  transactions: { status: string }[];
}

export default function LabProgressCard() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  async function fetchProgress() {
    try {
      const res = await fetch('/api/blockchain-lab/progress');
      const data = await res.json();
      setProgress(data);
    } catch (err) {
      console.error('Error fetching progress:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-tera-border border-t-tera-accent" />
      </div>
    );
  }

  const completedLessons = progress?.completedLessons || 0;
  const totalLessons = progress?.totalLessons || 4;
  const badgeCount = progress?.badges?.length || 0;
  const walletCount = progress?.walletCount || 0;

  return (
    <div className="tera-card">
      <h3 className="text-lg font-semibold text-tera-primary">Your Progress</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-tera-muted p-4">
          <p className="text-xs uppercase tracking-wide text-tera-secondary">Lessons</p>
          <p className="mt-2 text-2xl font-semibold text-tera-primary">
            {completedLessons}/{totalLessons}
          </p>
        </div>
        <div className="rounded-lg bg-tera-muted p-4">
          <p className="text-xs uppercase tracking-wide text-tera-secondary">Badges</p>
          <p className="mt-2 text-2xl font-semibold text-tera-primary">{badgeCount}</p>
        </div>
        <div className="rounded-lg bg-tera-muted p-4">
          <p className="text-xs uppercase tracking-wide text-tera-secondary">Wallets</p>
          <p className="mt-2 text-2xl font-semibold text-tera-primary">{walletCount}</p>
        </div>
        <div className="rounded-lg bg-tera-muted p-4">
          <p className="text-xs uppercase tracking-wide text-tera-secondary">Transactions</p>
          <p className="mt-2 text-2xl font-semibold text-tera-primary">
            {progress?.transactions?.filter((t: any) => t.status === 'confirmed').length || 0}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-2 overflow-hidden rounded-full bg-tera-muted">
          <div
            className="h-full bg-tera-accent transition-all duration-500"
            style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-tera-secondary">
          {completedLessons === totalLessons
            ? 'You completed all lessons!'
            : `${totalLessons - completedLessons} more lesson${totalLessons - completedLessons > 1 ? 's' : ''} to go`}
        </p>
      </div>
    </div>
  );
}