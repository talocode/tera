# Blockchain Lab Codex Rules

## Golden Rules

### Security
1. **NEVER connect to real blockchain networks** - This is a simulation only
2. **NEVER generate real private keys** - Use fake educational keys only
3. **NEVER ask users to connect wallets** - Use simulated wallets
4. **NEVER add real token addresses** - All tokens are simulated

### Educational Integrity
1. **Always label as fake** - Use "fake USDC", "simulated wallet"
2. **No investment language** - Never suggest buying or selling
3. **No financial advice** - This is education, not investment
4. **Clear safety notices** - Display prominently

### Code Quality
1. **Validate all inputs** - Use Zod schemas
2. **Server-side writes only** - Never expose service role
3. **Graceful AI fallbacks** - Don't break on Mistral failure
4. **TypeScript strict** - No `any` without reason

## Implementation Rules

### Naming Conventions
- Use `Simulated*` prefixes for types (SimulatedWallet, SimulatedTransaction)
- Use `fake` in variable names for clarity (fakeAddress, fakeBalance)
- Use `.blockchain-lab` for all related files and routes

### API Design
- All routes require authentication
- Return clear error messages
- Use proper HTTP status codes
- Include AI explanation on mutations

### UI/UX
- Match Tera's design system (Tailwind, tera-* classes)
- Support dark mode
- Use educational copy (not hype language)
- Show safety notices prominently

### Testing
- Test with unauthenticated users (should redirect)
- Test with new users (no wallets)
- Test with insufficient balance
- Test AI fallback scenarios

## Anti-Patterns

### Never Do
- ❌ Add "connect wallet" buttons
- ❌ Show real blockchain explorers
- ❌ Display "your balance" for real tokens
- ❌ Add trading/swap functionality
- ❌ Use real private key generation
- ❌ Add investment recommendations

### Always Do
- ✅ Use "fake", "simulated", "educational"
- ✅ Show safety notices
- ✅ Provide AI explanations
- ✅ Award badges for milestones
- ✅ Handle errors gracefully

## Future Considerations

When adding features later, ensure:
1. Keep simulation-only approach
2. Add Pro/Plus gating where needed
3. Maintain backward compatibility
4. Document new API routes
5. Update documentation