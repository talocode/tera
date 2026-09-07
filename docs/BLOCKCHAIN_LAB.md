# Blockchain Lab (Real Solana)

The Blockchain Lab is a real Solana lab. Users connect their own wallet, read live on-chain data, send real SOL, and
earn free monthly credits by holding TCODE.

## Rules

1. **Real wallet only** - Users connect their own Solana wallet (Phantom, Backpack, Solflare) via `window.solana`.
2. **Real on-chain reads** - Balances, transactions, blocks, and accounts are read live from Solana RPC. Never fabricate data.
3. **User signs every send** - The lab prepares a transaction, the wallet signs it, and the server broadcasts it.
4. **Never store private keys** - The server only ever stores a linked wallet address, verified by an ed25519 signature challenge.
5. **No simulated balances, tokens, or fake hashes.** Everything shown is real network data.

## Layout

- `lib/tcode/*` - TCODE hold-to-earn: challenge, link, holdings, claim.
- `lib/blockchain-lab/real/*` - Real Solana RPC layer, live wallet/tx/block reads, hand-rolled transaction builder (no web3.js dependency).
- `lib/blockchain-lab/schemas.ts` - progress input schema + progress/badge types.
- `lib/blockchain-lab/progress.ts` - real-chain badge logic (reads `credit_usage_events`: `tcode_link` -> first wallet badge, `solana_lab_send` -> first transfer badge).
- `app/api/tcode/*` - wallet link challenge API (also used by the lab wallet page).
- `app/api/blockchain-lab/real/*` - live wallet / explorer / send prepare / send confirm endpoints.
- `app/api/blockchain-lab/progress` - lab progress + badge summary used by LabProgressCard and BadgeGrid.
- `components/blockchain-lab/*` - client components for wallet connect, hold-to-earn, live explorer, and real SOL sends.

## Hold-to-earn

Holders of $TCODE link their real wallet once per account. Each UTC month, active tiers grant free credits into the
Tera balance: explorer 1x/1000cr, builder 100x/10000cr, ecosystem 1000x/100000cr, partner 5000x/500000cr.

## STORAGE NOTE

No DDL access to the Tera Supabase project. All wallet-link and send records are stored in `credit_usage_events`
with `event_type` values `tcode_challenge`, `tcode_link`, `tcode_claim`, and `solana_lab_send`, queried through
`metadata->>key` JSONB filters.