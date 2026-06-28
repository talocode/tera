import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import LabProgressCard from '@/components/blockchain-lab/LabProgressCard';
import BadgeGrid from '@/components/blockchain-lab/BadgeGrid';
import PublicProofPreview from '@/components/blockchain-lab/PublicProofPreview';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Proof Profile"
      description="Track your blockchain learning journey and showcase your achievements."
    >
      <div className="space-y-6">
        <LabProgressCard />
        <BadgeGrid />

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Simulation History</h3>
          <div className="mt-4 rounded-lg bg-tera-muted p-4">
            <p className="text-sm text-tera-secondary">
              Your transaction history, completed lessons, and earned badges will appear here as you progress through the lab.
            </p>
          </div>
        </div>

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Public Profile</h3>
          <PublicProofPreview />
        </div>
      </div>
    </BlockchainLabShell>
  );
}