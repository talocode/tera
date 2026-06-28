# Blockchain Lab Architecture

## Product Goal

Tera Blockchain Lab is a safe, AI-guided blockchain simulator where users learn how wallets, transactions, blocks, stablecoins, confirmations, gas fees, and smart contracts work without touching real money.

## Architecture Overview

### Stack
- **Frontend**: Next.js App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase/PostgreSQL
- **AI**: Mistral API for explanations (with fallback)

### Project Structure

```
Tera/
├── app/
│   ├── lab/blockchain/          # Lab pages
│   │   ├── page.tsx             # Overview
│   │   ├── wallet/              # Wallet simulator
│   │   ├── transactions/        # Transaction builder
│   │   ├── explorer/            # Block explorer
│   │   ├── stablecoins/         # Education page
│   │   ├── smart-contracts/     # Education page
│   │   └── profile/             # Progress & badges
│   ├── api/blockchain-lab/      # API routes
│   │   ├── wallets/
│   │   ├── transactions/
│   │   ├── blocks/
│   │   ├── explorer/
│   │   ├── progress/
│   │   ├── explain/
│   │   └── certificates/
│   └── tools/blockchain-lab/    # Tools entry point
├── components/blockchain-lab/   # Lab components
├── lib/blockchain-lab/         # Core logic
├── lib/ai/                      # AI tutor
└── lib/supabase/                # Data access
```

## Core Components

### Pages
1. **Overview** (`/lab/blockchain`) - Landing page with features and learning path
2. **Wallet** (`/lab/blockchain/wallet`) - Create and manage simulated wallets
3. **Transactions** (`/lab/blockchain/transactions`) - Send fake tokens between wallets
4. **Explorer** (`/lab/blockchain/explorer`) - Search blocks, transactions, wallets
5. **Stablecoins** - Educational content about stablecoins
6. **Smart Contracts** - Educational content about smart contracts
7. **Profile** - Progress tracking and badges

### API Routes
- `POST /api/blockchain-lab/wallets` - Create wallet
- `GET /api/blockchain-lab/wallets` - List wallets
- `POST /api/blockchain-lab/transactions` - Create transaction
- `GET /api/blockchain-lab/transactions` - List transactions
- `POST /api/blockchain-lab/blocks` - Create block
- `GET /api/blockchain-lab/blocks` - List blocks
- `GET /api/blockchain-lab/explorer` - Search blockchain
- `POST /api/blockchain-lab/progress` - Update progress
- `GET /api/blockchain-lab/progress` - Get progress
- `POST /api/blockchain-lab/explain` - Get AI explanation
- `GET /api/blockchain-lab/certificates` - Get badges/certificate

### Database Tables
- `blockchain_lab_wallets` - User wallets
- `blockchain_lab_balances` - Token balances
- `blockchain_lab_blocks` - Simulated blocks
- `blockchain_lab_transactions` - Transactions
- `blockchain_lab_lessons` - Lesson definitions
- `blockchain_lab_progress` - User progress
- `blockchain_lab_badges` - Badge definitions
- `blockchain_lab_user_badges` - Earned badges
- `blockchain_lab_public_profiles` - Public profiles

### Simulation Rules
1. Fake addresses use format `0xTera...` (not real Ethereum-compatible)
2. Starter balances: 100 USDC, 0.05 ETH, 25 TERA
3. Gas fees: 0.001 ETH for USDC/TERA, 0.002 ETH for ETH transfers
4. Transactions auto-confirm into blocks immediately
5. No real blockchain connection - all simulated locally

## Security Boundaries

### What We Do
- Generate fake wallet addresses for education
- Simulate transactions with fake tokens
- Create simulated blocks
- Explain concepts with AI
- Track progress and award badges

### What We DON'T Do
- Connect to real blockchain networks
- Generate real private keys
- Ask users to connect real wallets
- Create real tokens
- Add DeFi, trading, yield, swap logic
- Provide investment advice

## Future Roadmap

### Phase 1 (MVP - Complete)
- Wallet simulator
- Transaction builder
- Block explorer
- Basic badges

### Phase 2 (Pro Features)
- Full stablecoin payment simulation
- Smart contract playground
- AI-guided debugging
- Export learning reports

### Phase 3 (Advanced)
- Advanced simulations
- Public proof profile
- Project challenges
- Team/classroom mode
- API access