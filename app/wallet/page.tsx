export const metadata = {
  title: 'Tera Wallet',
  description: 'Self-custodial Solana wallet for SOL, SPL tokens, and official $TCODE. Keys stay in this browser.',
}

export default function WalletPage() {
  return (
    <iframe
      title="Tera Wallet"
      src="/wallet-app/index.html?embed=1"
      className="h-[calc(100dvh-4.25rem)] w-full border-0 bg-[#0a0a0a] md:h-[100dvh]"
    />
  )
}
