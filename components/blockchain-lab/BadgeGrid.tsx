'use client';

import React, { useState, useEffect } from 'react';
import { BADGE_INFO } from '@/lib/blockchain-lab/badges';

interface BadgeData {
  earned: string[];
  available: string[];
}

const badgeIcons: Record<string, React.ReactNode> = {
  wallet: (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 14h4" />
    </svg>
  ),
  send: (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  search: (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  coin: (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  ),
  graduation: (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  badge: (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
};

export default function BadgeGrid() {
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    try {
      const res = await fetch('/api/blockchain-lab/progress');
      const data = await res.json();
      setBadgeData({ earned: data.earned || [], available: data.available || [] });
    } catch (err) {
      console.error('Error fetching badges:', err);
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

  const allBadges = [...(badgeData?.earned || []), ...(badgeData?.available || [])];

  return (
    <div className="tera-card">
      <h3 className="text-lg font-semibold text-tera-primary">Badges</h3>
      {allBadges.length === 0 ? (
        <p className="mt-4 text-tera-secondary">No badges available yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBadges.map((slug) => {
            const info = BADGE_INFO[slug] || { title: slug, description: '', icon: 'badge' };
            const isEarned = badgeData?.earned.includes(slug);

            return (
              <div
                key={slug}
                className={`relative rounded-xl border p-4 ${
                  isEarned
                    ? 'border-tera-accent bg-tera-accent/10'
                    : 'border-tera-border bg-tera-muted opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      isEarned ? 'bg-tera-accent/20 text-tera-accent' : 'bg-tera-border text-tera-secondary'
                    }`}
                  >
                    {badgeIcons[info.icon] || badgeIcons.badge}
                  </div>
                  <div>
                    <h4 className="font-semibold text-tera-primary">{info.title}</h4>
                    <p className="mt-1 text-xs text-tera-secondary">{info.description}</p>
                  </div>
                </div>
                {isEarned && (
                  <div className="absolute right-3 top-3">
                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}