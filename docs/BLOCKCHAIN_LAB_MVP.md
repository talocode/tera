# Blockchain Lab MVP

## MVP Scope

The MVP delivers a fully functional educational blockchain simulator with:

### Core Features
- [x] Create simulated wallets with starter fake balances
- [x] Send fake USDC/ETH/TERA between wallets
- [x] Transaction timeline (Created → Pending → Confirmed → Block)
- [x] Block explorer with search
- [x] AI explanations for transactions
- [x] Progress tracking with badges
- [x] Educational content pages (stablecoins, smart contracts)

### Pages Implemented
1. `/lab/blockchain` - Landing page with learning path
2. `/lab/blockchain/wallet` - Wallet management
3. `/lab/blockchain/transactions` - Transaction builder
4. `/lab/blockchain/explorer` - Block explorer
5. `/lab/blockchain/stablecoins` - Education page (preview)
6. `/lab/blockchain/smart-contracts` - Education page (preview)
7. `/lab/blockchain/profile` - Progress & badges (preview)
8. `/tools/blockchain-lab` - Tools entry point

### User Journey
1. User opens `/lab/blockchain`
2. Creates first simulated wallet
3. Receives starter fake balances automatically
4. Sends fake USDC to another wallet
5. Sees transaction move through states
6. Views confirmed block in explorer
7. Earns "First Wallet" and "First Transfer" badges

### Accepted Features
- Simulated wallets with fake addresses
- Fake token transfers (USDC, ETH, TERA)
- Simulated gas fees (paid in fake ETH)
- Block creation with transaction references
- AI-powered explanations with fallbacks
- Progress tracking and badge system

### Out of Scope
- Real wallet connections
- Real blockchain networks
- Real private keys
- Token swapping
- DeFi integrations
- Trading or investment features

## QA Checklist

- [ ] User can create wallet and see starter balances
- [ ] User can send transaction between wallets
- [ ] Transaction status shows correct timeline
- [ ] Block is created with transaction
- [ ] Explorer can search and find blocks/transactions
- [ ] Badges are awarded for completing actions
- [ ] Pages are responsive and work on mobile
- [ ] Dark/light mode works correctly
- [ ] Safety notices are visible and clear

## Launch Checklist

- [ ] Run database migration
- [ ] Test all API routes
- [ ] Verify pages load correctly
- [ ] Check sidebar navigation works
- [ ] Test with authenticated user
- [ ] Verify RLS policies work
- [ ] Check all components render
- [ ] Verify no TypeScript errors
- [ ] Check build succeeds