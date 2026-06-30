# Tera API Billing

Tera API uses Talocode Cloud for authentication and billing. Every API call deducts credits from your Talocode Cloud wallet before execution.

## Architecture

```
Client → Tera API → Talocode Cloud Billing → Execute Capability → Response
```

1. Client sends request with `Authorization: Bearer <TALOCODE_API_KEY>`
2. Tera API authenticates the key
3. Tera API calls `POST /api/v1/cloud/usage/charge` on Talocode Cloud
4. If credits are insufficient, returns 402 immediately
5. If billing is unavailable, returns 502 — no work is done without billing
6. If charge succeeds, Tera API executes the capability
7. Response includes usage metadata

## Charge Behavior

- Credits are charged **before** execution.
- If execution fails after charging, the credits are consumed (v0.1 limitation — no refunds).
- Failed executions return a JSON error with the requestId for support tracing.

## Pricing

| Action | Credits | USD |
|--------|---------|-----|
| writing.rewrite | 5 | $0.05 |
| writing.draft | 10 | $0.10 |
| coding.explain | 10 | $0.10 |
| coding.review | 20 | $0.20 |

Prices are configured in the Tera API pricing config and will later sync with Talocode Cloud pricing.

## Talocode Cloud Endpoint

Tera API charges credits by calling:

```
POST ${STACKLANE_API_BASE_URL}/api/v1/cloud/usage/charge
```

Payload:

```json
{
  "product": "tera_api",
  "action": "writing.rewrite",
  "credits": 5,
  "requestId": "tera_req_abc123",
  "idempotencyKey": "tera_req_abc123",
  "metadata": {
    "route": "/v1/writing/rewrite",
    "inputSize": 140
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| STACKLANE_API_BASE_URL | http://localhost:4000 | Talocode Cloud API base URL |

## Insufficient Credits Response

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Insufficient Talocode Cloud credits. Required: 5.",
    "requestId": "tera_req_abc123"
  }
}
```

HTTP status: 402
