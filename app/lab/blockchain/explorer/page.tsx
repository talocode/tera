import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import LiveBlockExplorer from '@/components/blockchain-lab/LiveBlockExplorer';

export default async function ExplorerPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Block Explorer"
      description="Search and explore the real Solana network. View live blocks, transactions, and wallet data."
    >
      <LiveBlockExplorer />
    </BlockchainLabShell>
  );
}