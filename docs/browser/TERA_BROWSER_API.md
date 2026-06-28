# Tera Browser API

## Purpose

API layer for Tera Browser to connect to Tera intelligence, auth, memory, and page actions.

## Architecture

```
Tera Browser
    ↓
Tera Browser API
    ↓
Tera AI / Memory / User Account / Usage System
```

## Auth Model

- Browser API requires signed-in user for most actions
- Save-to-memory requires auth
- Usage checks tied to user plan/credits
- Do not bypass existing Tera auth

## v0.1 Scope

### Implemented

- `GET /api/browser/session` - Get session info
- `POST /api/browser/page/summarize` - Summarize page
- `POST /api/browser/page/ask` - Ask question about page
- `POST /api/browser/page/explain` - Explain page concepts
- `POST /api/browser/memory/save-page` - Save page to memory
- `GET /api/browser/usage` - Check usage/credits

### Not Yet Implemented (Future)

- `POST /api/browser/page/lesson` - Generate lesson
- `POST /api/browser/page/key-points` - Extract key points
- `POST /api/browser/memory/search` - Search memory
- `POST /api/browser/research/start` - Start research
- `POST /api/browser/research/add-source` - Add research source

### Visual Context Endpoints (Planned)

- `POST /api/browser/page/visual-summary` - Summarize page using text + screenshot
- `POST /api/browser/page/visual-ask` - Ask question using visual context
- `POST /api/browser/page/visual-explain` - Explain using visual analysis
- `POST /api/browser/page/hybrid-context` - Combined text + visual context

### Visual Context Request Shape

All visual context endpoints accept:

```json
{
  "url": "https://example.com",
  "title": "Page title",
  "text": "optional extracted text",
  "screenshot": {
    "mimeType": "image/png",
    "data": "base64 or upload reference",
    "width": 1440,
    "height": 900,
    "viewportOnly": true
  },
  "question": "optional",
  "mode": "student | teacher | researcher | general"
}
```

Field details:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | yes | Page URL |
| `title` | string | yes | Page title |
| `text` | string | no | Extracted readable text (may be empty if text extraction failed) |
| `screenshot` | object | yes | Screenshot payload |
| `screenshot.mimeType` | string | yes | Image MIME type (image/png, image/jpeg) |
| `screenshot.data` | string | yes | Base64-encoded image data or upload reference ID |
| `screenshot.width` | number | yes | Image width in pixels |
| `screenshot.height` | number | yes | Image height in pixels |
| `screenshot.viewportOnly` | boolean | yes | true = visible viewport only, false = full page |
| `question` | string | no | User question (required for visual-ask) |
| `mode` | string | no | Interaction mode (default: general) |

Size limits:

- Maximum screenshot data: 10MB base64 or 20MB upload
- Maximum text: 40,000 characters
- Maximum image dimensions: 8000x8000 pixels

### Visual Context Response Shape

```json
{
  "ok": true,
  "result": {
    "summary": "",
    "visibleElements": [],
    "keyPoints": [],
    "suggestedQuestions": [],
    "visualLimitations": []
  },
  "context": {
    "usedText": true,
    "usedScreenshot": true,
    "storedScreenshot": false
  }
}
```

Response field details:

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Request succeeded |
| `result.summary` | string | AI-generated summary or answer |
| `result.visibleElements` | array | List of visual elements identified (e.g., "data table with 5 columns", "bar chart showing revenue by quarter") |
| `result.keyPoints` | array | Key points extracted from visual analysis |
| `result.suggestedQuestions` | array | Follow-up questions the user might ask |
| `result.visualLimitations` | array | What the AI could not determine from the screenshot (e.g., "interactive elements not visible", "tooltip content hidden") |
| `context.usedText` | boolean | Whether text content was used in analysis |
| `context.usedScreenshot` | boolean | Whether screenshot was used in analysis |
| `context.storedScreenshot` | boolean | Whether screenshot was stored (default: false) |

### Error Responses

Provider not configured:
```json
{
  "ok": false,
  "error": "visual_provider_not_configured",
  "message": "No visual analysis provider is configured. Text-only analysis available."
}
```

Oversized image:
```json
{
  "ok": false,
  "error": "screenshot_too_large",
  "message": "Screenshot exceeds 10MB limit. Use viewportOnly or reduce resolution."
}
```

Private URL blocked:
```json
{
  "ok": false,
  "error": "private_url_blocked",
  "message": "Cannot capture private/local URLs in cloud mode."
}
```

## Request/Response Contracts

### Page Action Endpoints

Request:
```json
{
  "url": "https://example.com/article",
  "title": "Page title",
  "text": "Extracted readable page text",
  "question": "optional user question",
  "mode": "student | teacher | researcher | general"
}
```

Response:
```json
{
  "ok": true,
  "action": "summarize",
  "result": {
    "summary": "...",
    "keyPoints": [],
    "suggestedQuestions": []
  },
  "usage": {
    "creditsUsed": 1,
    "remainingCredits": 99
  }
}
```

## Privacy/Security

- No silent saving
- No external upload except to Tera backend
- No arbitrary local file access
- Block "file://", "localhost", private IP URLs
- Truncate long page text
- Redact tokens/API keys/passwords
- User must approve save-to-memory
- Browser actions auditable

## Future Roadmap

- Research mode
- Learning mode
- Agent-assisted browsing
- Page monitoring
- Multi-tab workflows
