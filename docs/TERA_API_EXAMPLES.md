# Tera API Examples

Base URL: `https://api.teraai.chat/v1`

Local: `http://localhost:3000/api/v1`

## Authentication

```bash
API_KEY="tk_dev_xxxxxxxxxxxx"

# Public (when live)
BASE="https://api.teraai.chat/v1"

# Local development
# BASE="http://localhost:3000/api/v1"
```

## Rewrite

```bash
curl -s -X POST "$BASE/writing/rewrite" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "We just shipped our browser agent.",
    "style": "clear, founder-like, X post",
    "tone": "direct",
    "maxLength": 280
  }'
```

Response:

```json
{
  "id": "tera_req_abc123",
  "object": "tera.writing.rewrite",
  "result": {
    "text": "We just shipped our browser agent.",
    "notes": []
  },
  "usage": {
    "credits": 5,
    "action": "writing.rewrite"
  }
}
```

## Draft

```bash
curl -s -X POST "$BASE/writing/draft" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "announcement",
    "brief": "Talocode Cloud v0.1 is live",
    "audience": "developers",
    "tone": "clear and builder-minded",
    "constraints": {
      "maxLength": 280
    }
  }'
```

Response:

```json
{
  "id": "tera_req_def456",
  "object": "tera.writing.draft",
  "result": {
    "text": "Talocode Cloud v0.1 is live — a unified API for browser agents, context capture, video, and more. One API key, prepaid credits, automatic fallback.",
    "title": null
  },
  "usage": {
    "credits": 10,
    "action": "writing.draft"
  }
}
```

## Explain

```bash
curl -s -X POST "$BASE/coding/explain" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "typescript",
    "code": "export function add(a,b){ return a+b }",
    "level": "beginner",
    "focus": ["logic", "types"]
  }'
```

Response:

```json
{
  "id": "tera_req_ghi789",
  "object": "tera.coding.explain",
  "result": {
    "summary": "This function adds two numbers.",
    "explanation": "The function takes two parameters a and b and returns their sum.",
    "importantLines": [
      {
        "line": 1,
        "reason": "Declares and exports the function"
      }
    ],
    "risks": []
  },
  "usage": {
    "credits": 10,
    "action": "coding.explain"
  }
}
```

## Review

```bash
curl -s -X POST "$BASE/coding/review" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "typescript",
    "code": "export function add(a,b){ return a+b }",
    "focus": ["types", "security"],
    "strictness": "normal"
  }'
```

Response:

```json
{
  "id": "tera_req_jkl012",
  "object": "tera.coding.review",
  "result": {
    "summary": "No critical issues found.",
    "issues": [
      {
        "severity": "low",
        "title": "Missing type annotations",
        "description": "Parameters a and b lack type annotations.",
        "suggestion": "Add type annotations: a: number, b: number"
      }
    ],
    "improvedCode": "export function add(a: number, b: number): number { return a + b }"
  },
  "usage": {
    "credits": 20,
    "action": "coding.review"
  }
}
```

## Health

```bash
curl -s "$BASE/health"
```

## Capabilities

```bash
curl -s "$BASE/capabilities"
```

## Pricing

```bash
curl -s "$BASE/pricing"
```

## Error: Missing API Key

```bash
curl -s -X POST "$BASE/writing/rewrite" \
  -H "Content-Type: application/json" \
  -d '{"text": "hello"}'
```

Returns 401:

```json
{
  "error": {
    "code": "missing_api_key",
    "message": "API key is required."
  }
}
```

## Error: Insufficient Credits

```bash
curl -s -X POST "$BASE/writing/rewrite" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "hello world"}'
```

If wallet has insufficient balance, returns 402:

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Insufficient Talocode Cloud credits. Required: 5.",
    "requestId": "tera_req_abc123"
  }
}
```

## Error: Invalid Body

```bash
curl -s -X POST "$BASE/writing/rewrite" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Returns 400:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Text is required.",
    "requestId": "tera_req_abc123"
  }
}
```
