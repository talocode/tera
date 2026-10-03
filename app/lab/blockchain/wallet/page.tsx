import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import RealSolanaWallet from '@/components/blockchain-lab/RealSolanaWallet';
import TcodeHoldToEarn from '@/components/blockchain-lab/TcodeHoldToEarn';

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Your Wallet"
      description="Connect your real Solana wallet and read live balances, tokens, and on-chain activity straight from the network."
    >
      <RealSolanaWallet />
      <div className="mt-6">
        <TcodeHoldToEarn />
      </div>
    </BlockchainLabShell>
  );
}