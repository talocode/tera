import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import BlockchainLabShell from '@/components/blockchain-lab/BlockchainLabShell';
import SmartContractSimulator from '@/components/blockchain-lab/SmartContractSimulator';

export default async function SmartContractsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <BlockchainLabShell
      title="Smart Contracts"
      description="Learn about self-executing programs on the blockchain that automate agreements."
    >
      <div className="space-y-6">
        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">What are Smart Contracts?</h3>
          <p className="mt-3 text-tera-secondary">
            Smart contracts are self-executing programs stored on the blockchain that automatically enforce
            rules when certain conditions are met. They are like digital agreements that cannot be changed
            once deployed.
          </p>
        </div>

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Key Concepts</h3>
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium text-tera-primary">Contract State</h4>
              <p className="mt-1 text-sm text-tera-secondary">
                The data stored in a contract that persists across transactions. This includes balances, ownership, and any custom data.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-tera-primary">Read Functions</h4>
              <p className="mt-1 text-sm text-tera-secondary">
                Functions that query the contract state without making changes. These usually don't cost gas fees.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-tera-primary">Write Functions</h4>
              <p className="mt-1 text-sm text-tera-secondary">
                Functions that modify the contract state. These require gas fees and must be confirmed by the network.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-tera-primary">Approvals</h4>
              <p className="mt-1 text-sm text-tera-secondary">
                Permissions you grant to contracts to spend tokens on your behalf. Always verify approvals before signing.
              </p>
            </div>
          </div>
        </div>

        <div className="tera-card">
          <h3 className="text-lg font-semibold text-tera-primary">Playground Preview</h3>
          <SmartContractSimulator />
        </div>
      </div>
    </BlockchainLabShell>
  );
}