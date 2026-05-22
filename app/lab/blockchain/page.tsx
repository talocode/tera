import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import LabProgressCard from '@/components/blockchain-lab/LabProgressCard';
import BadgeGrid from '@/components/blockchain-lab/BadgeGrid';
import { EDUCATIONAL_COPY } from '@/lib/blockchain-lab/constants';

const features = [
  {
    title: 'Wallet Simulator',
    description: 'Create fake wallets, understand addresses, and learn about private keys safely.',
    href: '/lab/blockchain/wallet',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    title: 'Stablecoin Transfer',
    description: 'Send fake USDC between wallets and understand how transactions work.',
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
    description: 'Search and explore blocks, transactions, and wallet data.',
    href: '/lab/blockchain/explorer',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    title: 'Smart Contract Playground',
    description: 'Learn about smart contracts, read/write functions, and more.',
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
    description: 'Track your learning progress and earn badges.',
    href: '/lab/blockchain/profile',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
];

const learningPath = [
  { step: 1, title: 'Create wallet', description: 'Make your first simulated wallet' },
  { step: 2, title: 'Receive fake USDC', description: 'Get starter balances automatically' },
  { step: 3, title: 'Send transaction', description: 'Transfer to another wallet' },
  { step: 4, title: 'Confirm block', description: 'See your transaction in a block' },
  { step: 5, title: 'Explore explorer', description: 'Search and inspect the blockchain' },
  { step: 6, title: 'Earn badge', description: 'Complete lessons to earn badges' },
];

export default async function BlockchainLabPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title={EDUCATIONAL_COPY.HEADLINE}
      description={EDUCATIONAL_COPY.SUBHEADLINE}
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-xl bg-blue-500/10 px-4 py-3">
            <p className="text-sm text-blue-400">{EDUCATIONAL_COPY.SAFETY_NOTICE}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/lab/blockchain/wallet" className="tera-button-primary">
              Start with your first fake wallet
            </Link>
            <Link href="/lab/blockchain/explorer" className="tera-button-secondary">
              Open Block Explorer
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-tera-primary">Learning Path</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learningPath.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 rounded-lg border border-tera-border bg-tera-panel p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tera-accent/20 text-tera-accent">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-medium text-tera-primary">{item.title}</h4>
                  <p className="text-sm text-tera-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-tera-primary">Features</h2>
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