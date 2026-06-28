import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import BlockExplorer from '@/components/blockchain-lab/BlockExplorer';

export default async function ExplorerPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Block Explorer"
      description="Search and explore your simulated blockchain. View blocks, transactions, and wallet data."
    >
      <BlockExplorer />
    </BlockchainLabShell>
  );
}