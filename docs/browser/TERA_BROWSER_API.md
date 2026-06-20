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
