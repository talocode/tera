import WalletFrame from '@/components/WalletFrame'

export const metadata = {
  title: 'Tera Wallet',
  description: 'Self-custodial Solana wallet for SOL, SPL tokens, and official $TCODE. Keys stay in this browser.',
}

export default function WalletPage() {
  return <WalletFrame />
}
