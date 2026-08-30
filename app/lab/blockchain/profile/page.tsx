import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import LabProgressCard from '@/components/blockchain-lab/LabProgressCard';
import BadgeGrid from '@/components/blockchain-lab/BadgeGrid';
import RealSolanaWallet from '@/components/blockchain-lab/RealSolanaWallet';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Proof Profile"
      description="Your real on-chain activity, completed lessons, and earned badges."
    >
      <div className="space-y-6">
        <LabProgressCard />
        <BadgeGrid />

        <RealSolanaWallet />

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Public Profile</h3>
          <div className="mt-4 rounded-lg bg-tera-muted p-4">
            <p className="text-sm text-tera-secondary">
              A public proof profile for your on-chain activity is coming to the web app. Your badges and completed
              lessons are already tracked.
            </p>
          </div>
        </div>
      </div>
    </BlockchainLabShell>
  );
}