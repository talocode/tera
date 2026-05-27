import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import TransactionBuilder from '@/components/blockchain-lab/TransactionBuilder';

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Transactions"
      description="Send fake tokens between wallets. See how transactions move from pending to confirmed."
    >
      <TransactionBuilder />
    </BlockchainLabShell>
  );
}