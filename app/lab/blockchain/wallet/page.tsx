import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import WalletSimulator from '@/components/blockchain-lab/WalletSimulator';

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Wallet Simulator"
      description="Create and manage your simulated blockchain wallets. Learn about public addresses and private keys safely."
    >
      <WalletSimulator />
    </BlockchainLabShell>
  );
}