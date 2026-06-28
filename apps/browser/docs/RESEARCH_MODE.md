# Research Mode

Tera Browser v0.2 adds Research Mode — a dedicated panel for capturing, summarizing, and sending page context to Tera.

## Activation

Click **Research Mode** on the new tab page. The panel shows capture actions and history.

## Actions

| Button           | Behavior                                              |
|------------------|-------------------------------------------------------|
| Capture Page     | Extracts text content from the current page           |
| Capture Selection| Captures page text (selection requires direct DOM)    |
| Summarize        | Opens Tera with the captured content for summarization|
| Send to Tera     | POSTs to `https://teraai.chat/api/browser/context`    |
| Save Source      | Saves to local capture history                        |
| Clear History    | Clears all local capture history                      |

## Capture Flow

1. User enables Research Mode
2. Navigates to a page
3. Clicks **Capture Page** (or Capture Selection)
4. Content is extracted, secrets are redacted, and stored locally
5. User can **Summarize** (opens Tera search), **Send to Tera** (API), or **Save Source** (local)

## Send to Tera

The `POST /api/browser/context` endpoint accepts:

```json
{
  "source": "tera-browser",
  "url": "https://example.com",
  "title": "Example",
  "text": "page text content...",
  "selectedText": "",
  "mode": "research"
}
```

### Behavior

- Validate payload, return JSON errors only
- Requires auth for server-side storage
- Secrets/sensitive pages are not stored server-side
- Returns `storedLocally: true` and warnings when content cannot be stored server-side

## Status Messages

- Success (green): capture saved, sent to Tera
- Warning (yellow): no content, Firecrawl not configured, local-only storage
- Error (red): capture failed, network error
- Info (blue): progress, mode enabled

## Limitations

- Selection capture requires direct DOM access (Electron `executeJavaScript`)
- Server-side storage requires authentication
- Text-only: no image/PDF capture
- Content capped at 50K characters for local, 100K for API
- Summarization opens Tera in external browser (in-app summarization coming in v0.3)
