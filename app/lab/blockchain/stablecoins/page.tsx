import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import StablecoinTransferSimulator from '@/components/blockchain-lab/StablecoinTransferSimulator';

export default async function StablecoinsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Stablecoins"
      description="Learn about stablecoins like USDC and USDT - cryptocurrencies pegged to real-world currencies."
    >
      <div className="space-y-6">
        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">What are Stablecoins?</h3>
          <p className="mt-3 text-tera-secondary">
            Stablecoins are cryptocurrencies designed to maintain a stable value by being pegged to a reserve asset like the US dollar.
            The most popular stablecoins are USDC and USDT.
          </p>
          <h4 className="mt-6 font-semibold text-tera-primary">Why People Use Stablecoins</h4>
          <ul className="mt-3 list-inside list-disc space-y-2 text-tera-secondary">
            <li>Avoid cryptocurrency price volatility</li>
            <li>Send money globally with lower fees than traditional banking</li>
            <li>Store value in a digital format without converting to fiat</li>
            <li>Use in DeFi applications for earning interest</li>
          </ul>
        </div>

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Network Selection</h3>
          <p className="mt-3 text-tera-secondary">
            Stablecoins exist on multiple blockchain networks (Ethereum, Solana, Polygon, etc.). When sending stablecoins,
            you must ensure both sender and receiver use the same network. Sending to the wrong network can result in permanent loss.
          </p>
        </div>

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Simulation Preview</h3>
          <StablecoinTransferSimulator />
        </div>
      </div>
    </BlockchainLabShell>
  );
}