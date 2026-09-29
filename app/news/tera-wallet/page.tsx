import Link from 'next/link'

export const metadata = {
  title: 'Tera Wallet is live',
  description: 'Launch note for the self-custodial Solana wallet on Tera.',
}

export default function TeraWalletNewsPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-8 md:pt-10">
        <article className="tera-surface px-6 py-10 md:px-10 md:py-14">
          <p className="tera-eyebrow">29 September 2026</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">
            Tera Wallet is live
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-tera-secondary md:text-lg">
            Tera now has a wallet. It is self-custodial, it speaks Solana, and it knows the official $TCODE mint. Tera does not hold the keys.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/wallet" className="tera-button-primary">Open Tera Wallet</Link>
            <Link href="/docs/wallet" className="tera-button-secondary">Read the docs</Link>
          </div>
          <video
            className="mt-8 w-full overflow-hidden rounded-2xl border border-tera-border bg-black"
            controls
            playsInline
            preload="metadata"
            src="/videos/tera-wallet-launch.mp4"
          >
            A walkthrough of Tera Wallet on teraai.chat.
          </video>
          <div className="mt-10 max-w-3xl space-y-5 text-sm leading-7 text-tera-secondary md:text-base">
            <p>
              Create a 12-word wallet or import a 12 or 24 word phrase. The first Solana account is derived at m/44'/501'/0'/0', the same path used by Phantom and the Solana CLI. You confirm three words before the phrase is encrypted on this device with your passcode.
            </p>
            <p>
              From there you can copy the address, show a receive QR, read SOL and SPL balances, and send with a local signature. Official $TCODE is mint 6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory on Solana mainnet, 6 decimals. The wallet on teraai.chat opens on mainnet. Devnet is a switch in Settings, not the default.
            </p>
            <p>
              There is no dollar price, no swap button, and no other chain pretending to work. Empty balances stay empty. A failed send stays failed. Removing the wallet from the browser deletes the local ciphertext only. The phrase still controls the funds.
            </p>
            <p>
              The passcode is not a hardware wallet. Write the phrase down offline. Do not send it to anyone, including Tera.
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
