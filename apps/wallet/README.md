# Tera Wallet

Self-custodial Solana wallet for the Tera ecosystem. You hold the recovery phrase. Tera cannot reset it, see it, or sign for you.

## What works

- Create a 12-word BIP-39 wallet and confirm three words before it is saved
- Import a 12 or 24 word recovery phrase
- Derive Solana account 0 at `m/44'/501'/0'/0'`
- Encrypt the phrase in this browser with a passcode (PBKDF2-SHA256 + AES-GCM)
- Lock, unlock, and auto-lock after five idle minutes
- Show the public address, copy it, and render a QR code
- Read native SOL and SPL token balances, including Token-2022 accounts
- Show official mainnet **$TCODE** (`6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory`, 6 decimals)
- Send SOL or an SPL token you hold, with a local signature, fee estimate, and explorer link
- List recent signatures for the address
- Switch between Solana devnet and mainnet

## What is not supported

- Ethereum, Base, Polygon, or any chain other than Solana
- Hardware wallets, multisig, and account indexes beyond the first derived account
- A hosted custody or recovery service
- Dollar prices. Balances are token amounts only
- Swaps, staking, and NFT galleries

The passcode is not hardware-wallet security. Malware on the device can still read an unlocked wallet.

## Architecture

The wallet UI is a client-only Vite app. Secret material never goes in a URL, an API request, or a server render.

| Piece | Role |
| --- | --- |
| `src/wallet/keys.ts` | Mnemonic checks and SLIP-0010 Ed25519 derivation (`bip39` + `@noble/hashes`, checked against `ed25519-hd-key`) |
| `src/wallet/vault.ts` | Encrypts the phrase before `localStorage` |
| `src/wallet/chain.ts` | Public RPC reads and locally signed transfers |
| `src/wallet/network.ts` | Cluster, RPC, $TCODE mint, explorer URLs |
| `src/components/wallet/` | Create, import, unlock, portfolio, send, receive, settings |

Chain support is a `Cluster` union of `devnet` and `mainnet-beta`. Other chains are not stubbed as if they worked.

## Install and run

```bash
cd apps/wallet
npm install
npm run dev
```

The dev server defaults to **devnet**, so a fresh session cannot accidentally sign a mainnet transaction. Switch to mainnet in Settings only when you intend to use real funds. Official $TCODE exists on mainnet; a devnet balance of zero is expected.

```bash
npm test
npm run typecheck
npm run build
```

## Environment

Copy `.env.example`. All `VITE_` values are public. Never put a seed phrase, private key, or passcode in the environment.

| Variable | Purpose |
| --- | --- |
| `VITE_SOLANA_CLUSTER` | `devnet` or `mainnet-beta` |
| `VITE_SOLANA_RPC_URL` | Optional RPC. Applied only when `VITE_SOLANA_CLUSTER` is the same network |
| `VITE_TCODE_MINT` | $TCODE mint. Defaults to the official mainnet mint |

Public Solana RPC endpoints are rate limited. A dedicated RPC is optional and should still be treated as public, because the browser calls it directly.

## Security model

- The recovery phrase is generated with `bip39` and checked with the BIP-39 wordlist
- The Solana secret is derived locally. It is not logged
- After backup, the phrase is encrypted and the draft is dropped from memory on save
- Unlock decrypts it only into component state. Lock overwrites the secret key bytes and drops the reference
- Reveal-phrase is a separate passcode check on the Security screen
- Addresses are validated with `@solana/web3.js` `PublicKey` before a transfer is built
- Sends are blocked when the amount or fee exceeds the on-chain balance
- Removing the wallet deletes the ciphertext from this browser. It does not destroy funds. The phrase still controls them

## Contributing

Keep secrets client-side. Do not add a backend that accepts phrases, keys, or passcodes. Add a chain only when sends, balances, and explorers are real. Prefer a failing empty state over a fake balance.

## Roadmap

- More derivation accounts
- A clearer Token-2022 vs classic token-program split when both are present
- Optional hardware-wallet signing
- Additional chains behind the same portfolio shell, only after they actually sign
