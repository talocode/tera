import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import SolanaSend from '@/components/blockchain-lab/SolanaSend';
import RealSolanaWallet from '@/components/blockchain-lab/RealSolanaWallet';

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Transactions"
      description="Send real SOL from your linked wallet and watch your on-chain history update live."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <SolanaSend />
        <RealSolanaWallet />
      </div>
    </BlockchainLabShell>
  );
}