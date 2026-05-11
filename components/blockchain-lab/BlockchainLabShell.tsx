'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const labNavItems = [
  { label: 'Overview', href: '/lab/blockchain' },
  { label: 'Wallet', href: '/lab/blockchain/wallet' },
  { label: 'Transactions', href: '/lab/blockchain/transactions' },
  { label: 'Explorer', href: '/lab/blockchain/explorer' },
  { label: 'Stablecoins', href: '/lab/blockchain/stablecoins' },
  { label: 'Smart Contracts', href: '/lab/blockchain/smart-contracts' },
  { label: 'Profile', href: '/lab/blockchain/profile' },
];

interface BlockchainLabShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function BlockchainLabShell({ title, description, children }: BlockchainLabShellProps) {
  const pathname = usePathname();

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Blockchain Lab</p>
            <h1 className="tera-title mt-3">{title}</h1>
            <p className="tera-subtitle mt-4">{description}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <div className="tera-segmented">
            {labNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/lab/blockchain' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`tera-segmented-item ${isActive ? 'data-[active=true]' : ''}`}
                  data-active={isActive}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}