# Context Capture

Tera Browser v0.2 adds client-side page context capture for research, summarization, and sending to Tera.

## Architecture

```
apps/browser/src/lib/context-capture/
  types.ts       — shared types
  extract.ts     — DOM extraction, URL validation, secret redaction
  clean.ts       — HTML cleaning, text normalization
  summarize.ts   — local text summarization (brief, detailed, key-points)
  providers.ts   — provider fallback chain (DOM → Jina → Firecrawl → fetch)
  storage.ts     — capture history (IPC bridge with localStorage fallback)
  index.ts       — public API
```

## Capture Output

Each capture includes:

| Field         | Description                          |
|---------------|--------------------------------------|
| `id`          | unique ID (`cc_<ts>_<rand>`)        |
| `url`         | captured page URL                    |
| `title`       | page title from og/twitter/HTML      |
| `description` | meta description                     |
| `text`        | extracted text content (≤50K chars)  |
| `headings`    | h1-h3 elements                       |
| `links`       | external links with text (≤200)      |
| `selectedText`| user-selected text (if any)          |
| `capturedAt`  | ISO timestamp                        |
| `source`      | `browser`, `search`, or `manual-url` |
| `warnings`    | issues encountered during capture    |

## Safety

- Unsafe protocols (`javascript:`, `data:`, `file:`) are blocked
- Private/local IP ranges are rejected
- Common secret patterns are redacted (API keys, tokens, passwords)
- Sensitive page patterns (login, payment, password reset) are detected
- No cookies, localStorage, or credentials are captured
- Explicit user action is required for every capture

## Provider Fallback

When capturing via provider chain:

1. **DOM extraction** — reads `article`/`main`/`body` content
2. **Jina Reader** — `r.jina.ai` proxy (public, no key needed)
3. **Firecrawl** — requires `FIRECRAWL_API_KEY` env var
4. **Fetch/Readability** — raw HTTP + HTML stripping

If Firecrawl key is missing, returns warning: "Firecrawl not configured; used local extraction fallback."

## Storage

- Electron path: `<userData>/captures/captures.json` and `histories.json`
- Browser fallback: `localStorage` (`tera_browser_capture_history`)
- Max 50 full captures, 100 history entries
- No secrets stored server-side
