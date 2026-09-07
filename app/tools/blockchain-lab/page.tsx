import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function BlockchainLabToolsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-20 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Tools</p>
            <h1 className="tera-title mt-3">Blockchain Lab</h1>
            <p className="tera-subtitle mt-4">
              Learn blockchain with your real Solana wallet.
              Live balances, real transactions, and live on-chain explorers.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-xl border border-tera-border bg-tera-panel p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-tera-primary">Blockchain Lab</h2>
                <p className="mt-2 text-tera-secondary">
                  A real Solana lab where you can connect your own wallet, track live balances, send real SOL,
                  and inspect live blocks, transactions, and prices on-chain.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/lab/blockchain" className="tera-button-primary">
                    Open Lab
                  </Link>
                  <Link href="/lab/blockchain/wallet" className="tera-button-secondary">
                    Start Learning
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-tera-border bg-tera-muted p-4">
              <h3 className="font-semibold text-tera-primary">What You'll Learn</h3>
              <ul className="mt-3 space-y-2 text-sm text-tera-secondary">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  How crypto wallets work
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Transaction lifecycle
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Block confirmations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Gas fees explained
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Using block explorers
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-tera-border bg-tera-muted p-4">
              <h3 className="font-semibold text-tera-primary">You're in Control</h3>
              <ul className="mt-3 space-y-2 text-sm text-tera-secondary">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Your own wallet
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Keys stay in your wallet
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Approve every transaction
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Live on-chain data
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Hold TCODE, earn free credits
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
