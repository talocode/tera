import Link from 'next/link'

export const metadata = {
  title: 'Tera Wallet docs',
  description: 'How Tera Wallet works: keys, backup, Solana, $TCODE, send, receive, and what it does not do.',
}

export default function WalletDocsPage() {
  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-8 md:pt-10">
        <section className="tera-surface px-6 py-10 md:px-10 md:py-14">
          <p className="tera-eyebrow">Docs</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-tera-primary md:text-5xl">
            Tera Wallet
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-tera-secondary md:text-lg">
            A self-custodial Solana wallet inside Tera. You hold the recovery phrase. Tera cannot see it, reset it, or sign for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/wallet" className="tera-button-primary">Open the wallet</Link>
            <Link href="/news/tera-wallet" className="tera-button-secondary">Launch note</Link>
          </div>
        </section>

        <article className="tera-card mt-8 space-y-10 text-sm leading-7 text-tera-secondary md:text-base">
          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">What it is</h2>
            <p className="mt-3">
              Tera Wallet creates a Solana account in this browser, encrypts the recovery phrase with a passcode you choose, and uses that account to read balances and sign transfers. There is no Tera custody server in the path. The public address can be shared. The recovery phrase and the passcode cannot.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Create a wallet</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Open Wallet from the left navigation, or go to teraai.chat/wallet.</li>
              <li>Choose “Create a new wallet”. The phrase is generated on the device with BIP-39, 12 words.</li>
              <li>Reveal it and write it down offline. Do not screenshot it. Do not paste it into chat.</li>
              <li>Confirm three of the words. This checks that the backup exists before anything is saved.</li>
              <li>Set a passcode of 6 to 64 characters. That passcode encrypts the phrase. It is not a second key and it is not hardware-wallet security.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Import a wallet</h2>
            <p className="mt-3">
              “I already have a recovery phrase” accepts a 12 or 24 word BIP-39 phrase. Extra spaces and capital letters are ignored. An invalid phrase is rejected before anything is stored. The imported account is the first Solana account, not a later account index.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">The key</h2>
            <p className="mt-3">
              The Solana address is account 0 at the path <span className="text-tera-primary">m/44'/501'/0'/0'</span>. That is the same first account Phantom and the Solana CLI derive from a phrase. Derivation happens locally. The secret key is wiped from memory when you lock the wallet.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">What is stored</h2>
            <p className="mt-3">
              After backup, the phrase is encrypted with PBKDF2-SHA256, 210,000 iterations, and AES-GCM. The ciphertext, salt, and the public address live in this browser’s local storage under <span className="text-tera-primary">tera.wallet.vault.v1</span>. The selected network is stored separately. The phrase is not put in the URL, in logs, or in a Tera API request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Lock and unlock</h2>
            <p className="mt-3">
              Unlock decrypts the phrase with the passcode and checks that the derived address matches the saved address. A wrong passcode fails closed. The wallet locks from Settings, from Home, and automatically after five minutes without a pointer press. Locking drops the secret from memory. Refreshing the page also starts locked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Balances</h2>
            <p className="mt-3">
              Home reads native SOL plus SPL token accounts, including Token-2022 accounts, from the Solana cluster you selected. On mainnet the browser does not start at api.mainnet-beta.solana.com, because that endpoint returns 403 to the page. It tries public endpoints in order and skips one that answers 403, 429, or a blocked method. If a token-account index is refused, SOL still shows. Amounts are token units, not dollar prices. Official $TCODE is the Solana mainnet mint <span className="break-all text-tera-primary">6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory</span>, 6 decimals, name Talocode. It exists on mainnet. A zero balance is an empty wallet, not a placeholder. Other SPL mints are labeled SPL plus a short mint, not a guessed ticker.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Receive</h2>
            <p className="mt-3">
              Receive shows the public address, a copy button, a QR code of that address only, and a Solana Explorer link for the selected network. The QR does not contain the recovery phrase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Send</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Pick a token you actually hold. SOL is always listed.</li>
              <li>Paste a Solana address. It is checked before a transaction is built.</li>
              <li>Enter an amount. Too many decimals, zero, and amounts above the balance are blocked.</li>
              <li>Review shows the token, the recipient, the network, and a fee estimate. A missing recipient token account includes the rent to create it.</li>
              <li>Confirm signs locally and submits the signed transaction. SOL uses a system transfer. SPL uses the token program that owns the mint, classic or Token-2022.</li>
              <li>Success links to the explorer. Failure stays on the screen with the reason. Nothing is marked sent until the network confirms it.</li>
            </ol>
            <p className="mt-3">
              Sending SOL also keeps enough lamports for the network fee. Sending a token still requires SOL for the fee. The production wallet on teraai.chat opens on Solana mainnet. Mainnet moves real funds. Switch to devnet in Settings only when you mean to use test SOL.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Activity</h2>
            <p className="mt-3">
              Activity lists recent signatures for the address on the selected network. SOL changes and SPL balance changes are decoded when the RPC returns them. Empty history is shown as empty. A busy public RPC can lag or fail, and the screen says so instead of inventing transactions. A 403 from one endpoint is not shown as your balance if another endpoint answered.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Networks</h2>
            <p className="mt-3">
              Settings switches between Solana mainnet and Solana devnet. The keys do not change. The balances do, because they are different networks. An optional RPC is used only for the cluster it was configured for, so a devnet endpoint cannot silently follow you onto mainnet. If that override fails, the wallet continues through the public list for that cluster. Public Solana RPC endpoints are rate limited, and some of them refuse indexed token reads.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">Remove the wallet</h2>
            <p className="mt-3">
              “Remove wallet from this device” deletes the ciphertext from this browser after a second confirmation. It does not destroy the funds. Anyone with the recovery phrase can still restore the account. If the phrase is gone and the ciphertext is deleted, the funds are gone.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-tera-primary">What it does not do</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>No Ethereum, Base, or Polygon. Solana only.</li>
              <li>No hardware wallet, multisig, or accounts beyond the first derived account.</li>
              <li>No swaps, staking, or NFT gallery.</li>
              <li>No dollar prices.</li>
              <li>No hosted recovery. Tera support cannot reset a passcode.</li>
              <li>A browser passcode is not a hardware wallet. Malware on the device can read an unlocked wallet.</li>
            </ul>
          </section>
        </article>
      </div>
    </div>
  )
}
