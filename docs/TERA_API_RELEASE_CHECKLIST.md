# Tera API Release Checklist

## Pre-Flight

- [ ] All tests pass: `node --experimental-strip-types --test scripts/test-tera-api.mjs`
- [ ] Smoke script passes: `node scripts/smoke-tera-api-v0.1.mjs`
- [ ] Next.js build succeeds: `pnpm build`
- [ ] TypeScript type check passes: `pnpm type-check`
- [ ] No secrets or API keys committed
- [ ] No raw API keys logged in any code path
- [ ] Branch is `feat/tera-api-v0.1` (not `main`)

## Environment Variables

| Variable | Required | Production Value | Notes |
|----------|----------|------------------|-------|
| STACKLANE_API_BASE_URL | Yes | https://api.stacklane.com | Talocode Cloud billing API base |
| MISTRAL_API_KEY | Yes* | production key | AI provider for capabilities |
| TERA_API_ALLOW_MOCK_PROVIDER | No | `false` | Must be `false` or unset in production |
| TERA_API_PROVIDER | No | `mistral` | Override provider name |
| TERA_API_MODEL | No | `mistral-small-latest` | Override model name |

> \* `MISTRAL_API_KEY` is required unless using a different provider via `TERA_API_PROVIDER` and the corresponding API key.

### Local Development

```bash
STACKLANE_API_BASE_URL=http://localhost:4000
MISTRAL_API_KEY=your_dev_key
TERA_API_ALLOW_MOCK_PROVIDER=true
```

## DNS

- [ ] `api.teraai.chat` CNAME → Netlify site hostname
- [ ] DNS TTL set appropriately (300s recommended for initial rollout)
- [ ] SSL/TLS certificate provisioned (Netlify handles this automatically)

## Deployment

- [ ] Deploy branch `feat/tera-api-v0.1` to Netlify
- [ ] Verify `api.teraai.chat/v1/health` returns 200
- [ ] Verify `api.teraai.chat/v1/capabilities` returns capability list
- [ ] Verify `api.teraai.chat/v1/pricing` returns pricing
- [ ] Test authentication: missing key returns 401
- [ ] Test authentication: valid key passes through to billing
- [ ] Verify main app at `teraai.chat` is unaffected

## Billing

- [ ] `api.teraai.chat/v1/pricing` returns correct credit values
- [ ] Talocode Cloud wallet has sufficient funds for testing
- [ ] Billing errors return proper JSON (402, 502)
- [ ] `STACKLANE_API_BASE_URL` points to production Talocode Cloud

## Post-Deploy

- [ ] Monitor error logs for `billing_unavailable` or `provider_unavailable` errors
- [ ] Verify response headers: `x-tera-request-id`, `x-tera-credits-charged`, etc.
- [ ] Check that `x-tera-billing-provider: stacklane` is present
- [ ] Run smoke script against production: `TERA_API_BASE_URL=https://api.teraai.chat/v1 TALOCODE_API_KEY=tk_live_... node scripts/smoke-tera-api-v0.1.mjs`

## Rollback

- [ ] Deploy previous working branch to Netlify
- [ ] Update `api.teraai.chat` DNS to point to previous deploy (if using branch deploy)
- [ ] Or revert the Netlify deploy to a previous version

## Known v0.1 Limitations

1. No refund system — credits consumed even if provider execution fails
2. Provider is abstracted but only Mistral is configured
3. Input validation is basic Zod — no streaming or async validation
4. No rate limiting beyond wallet balance
5. No webhook for billing events
6. API routes are served alongside the main app — no dedicated API server
