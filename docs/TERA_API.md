# Tera API v0.1

Tera API is a capability-based API for useful writing and coding workflows. It is not a raw model resale API. You pay for capabilities, not model access.

## Base URL

Production: `https://api.teraai.chat/v1`

Local development: `http://localhost:3000/api/v1`

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

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/v1/writing/rewrite` | Rewrite text with a specified style and tone |
| POST | `/v1/writing/draft` | Draft content from a brief |
| POST | `/v1/coding/explain` | Explain how code works |
| POST | `/v1/coding/review` | Review code for issues |
| GET | `/v1/health` | Service health check |
| GET | `/v1/capabilities` | List available capabilities |
| GET | `/v1/pricing` | Current pricing |

## Pricing

| Action | Credits | USD |
|--------|---------|-----|
| writing.rewrite | 5 | $0.05 |
| writing.draft | 10 | $0.10 |
| coding.explain | 10 | $0.10 |
| coding.review | 20 | $0.20 |

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

## Notes

- Tera API sells capabilities (writing, coding, research), not raw model access.
- The internal AI provider is an implementation detail and subject to change.
- API keys are managed through Talocode Cloud.
- Billing is handled through Talocode Cloud prepaid wallets.
