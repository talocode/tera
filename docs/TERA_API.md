# Tera API v0.1

Tera API is a capability-based API for useful writing and coding workflows. It is not a raw model resale API. You pay for capabilities, not model access.

## Base URL

Tera API is part of Talocode Cloud. Use:

```
TALOCODE_BASE_URL=https://api.talocode.site
```

| Environment | URL |
|-------------|-----|
| Production | `https://api.talocode.site/v1/tera` |
| Production (alias) | `https://api.teraai.chat/v1` |
| Local (Next.js rewrites) | `http://localhost:3000/v1/tera` |
| Local (direct) | `http://localhost:3000/api/v1/tera` |

All routes are available under both `/v1/tera/` (namespaced) and `/v1/` (legacy) paths for backward compatibility.

> Note: The public API is not yet live. See `TERA_API_RELEASE_CHECKLIST.md` for deployment readiness.

## Authentication

All requests require a Talocode Cloud API key. Provide it via:

```
Authorization: Bearer tk_dev_xxxxxxxxxxxx
```

or

```
X-Api-Key: tk_dev_xxxxxxxxxxxx
```

Get an API key from the Talocode Cloud Dashboard.

## Endpoints

| Method | Route | Aliased Route | Description |
|--------|-------|---------------|-------------|
| POST | `/v1/writing/rewrite` | `/v1/tera/writing/rewrite` | Rewrite text with a specified style and tone |
| POST | `/v1/writing/draft` | `/v1/tera/writing/draft` | Draft content from a brief |
| POST | `/v1/coding/explain` | `/v1/tera/coding/explain` | Explain how code works |
| POST | `/v1/coding/review` | `/v1/tera/coding/review` | Review code for issues |
| POST | `/v1/coding/write` | `/v1/tera/coding/write` | Write production-ready code from a task description |
| GET | `/v1/health` | — | Service health check |
| GET | `/v1/capabilities` | — | List available capabilities |
| GET | `/v1/pricing` | — | Current pricing |

## Pricing

| Action | Credits | USD |
|--------|---------|-----|
| writing.rewrite | 5 | $0.05 |
| writing.draft | 10 | $0.10 |
| coding.explain | 10 | $0.10 |
| coding.review | 20 | $0.20 |
| coding.write | 20 | $0.20 |

1 credit = $0.01 USD. Credits are deducted from your Talocode Cloud wallet.

## Errors

All errors return JSON:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable message.",
    "requestId": "tera_req_abc123"
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| missing_api_key | 401 | No API key provided |
| invalid_request | 400 | Invalid or missing request body |
| insufficient_credits | 402 | Not enough Talocode Cloud credits |
| billing_unavailable | 502 | Billing service unreachable or error |
| provider_unavailable | 503 | AI provider request failed |
| internal_error | 500 | Unexpected server error |

## Response Headers

| Header | Description |
|--------|-------------|
| x-tera-request-id | Unique request identifier |
| x-tera-api-action | Action performed |
| x-tera-credits-charged | Credits charged |
| x-tera-billing-provider | Billing backend |
| x-tera-capability | Capability category |

## Rate Limits

Tera API is rate-limited by your Talocode Cloud wallet balance. There are no separate rate limits at the API level in v0.1.

## Domain Routing

Tera API runs under two routing schemes:

### Talocode Cloud (canonical)

```
https://api.talocode.site/v1/tera/writing/rewrite
```

This is the canonical base URL for all Talocode Cloud products. Each product is namespaced under `/v1/{product}/`.

### teraai.chat (alias)

The API is also served alongside the main teraai.chat app via a Next.js rewrite rule mapping `/v1/:path*` → `/api/v1/:path*`:

- `https://api.teraai.chat/v1/writing/rewrite` (via api.teraai.chat)
- `https://teraai.chat/api/v1/writing/rewrite` (via main app)
- `http://localhost:3000/v1/writing/rewrite` (local, via rewrite)
- `http://localhost:3000/api/v1/writing/rewrite` (local, direct)

For local development, use `/api/v1/` directly. The `/v1/` prefix is handled by the rewrite rule at runtime.

See `TERA_API_DOMAIN_ROUTING.md` for the full routing and DNS plan.

## Notes

- Tera API sells capabilities (writing, coding, research), not raw model access.
- The internal AI provider is an implementation detail and subject to change.
- API keys are managed through Talocode Cloud.
- Billing is handled through Talocode Cloud prepaid wallets.
