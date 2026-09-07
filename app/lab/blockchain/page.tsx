import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import LabProgressCard from '@/components/blockchain-lab/LabProgressCard';
import BadgeGrid from '@/components/blockchain-lab/BadgeGrid';
import TcodeHoldToEarn from '@/components/blockchain-lab/TcodeHoldToEarn';

const features = [
  {
    title: 'Your Wallet',
    description: 'Connect your real Solana wallet and read live balances and tokens from the network.',
    href: '/lab/blockchain/wallet',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    title: 'Send SOL',
    description: 'Send real SOL through your own wallet. You approve every transaction.',
    href: '/lab/blockchain/transactions',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </svg>
    ),
  },
  {
    title: 'Block Explorer',
    description: 'Search live blocks, transactions, and addresses on the real Solana chain.',
    href: '/lab/blockchain/explorer',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    title: 'Stablecoins',
    description: 'Understand stablecoins and track live stablecoin balances on Solana.',
    href: '/lab/blockchain/stablecoins',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: 'Smart Contracts',
    description: 'Learn how programs and smart contracts work on Solana.',
    href: '/lab/blockchain/smart-contracts',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    title: 'Proof Profile',
    description: 'Track your real on-chain activity, lessons, and badges.',
    href: '/lab/blockchain/profile',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
];

export default async function BlockchainLabPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell title="Blockchain Lab" description="Real Solana. Your wallet. Live on-chain data.">
      <div className="space-y-8">
        {/* REAL HOLD-TO-EARN FIRST */}
        <TcodeHoldToEarn />

        {/* ORYNTH BADGE SLOT — paste the provided badge snippet here */}
        <a href="https://orynth.dev/projects/talocode-8992" target="_blank" rel="noopener noreferrer">
          <img
            src="https://orynth.dev/api/badge/talocode-8992?theme=light&style=default"
            alt="Featured on Orynth"
            width="260"
            height="80"
          />
        </a>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl bg-blue-500/10 px-4 py-3">
            <p className="text-sm text-blue-400">
              Connect your own wallet. Real addresses, real balances, real transactions. You are in control, and every
              transfer is approved by you before it is broadcast.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/lab/blockchain/wallet" className="tera-button-primary">
              Connect your wallet
            </Link>
            <Link href="/lab/blockchain/explorer" className="tera-button-secondary">
              Open live explorer
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-tera-primary">Lab</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group block rounded-xl border border-tera-border bg-tera-panel p-5 transition hover:border-tera-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tera-accent/20 text-tera-accent">
                  {feature.icon}
                </div>
                <h3 className="mt-4 font-semibold text-tera-primary group-hover:text-tera-accent">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-tera-secondary">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <LabProgressCard />
        <BadgeGrid />
      </div>
    </BlockchainLabShell>
  );
}