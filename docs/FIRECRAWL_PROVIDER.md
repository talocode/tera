# Firecrawl Provider

Firecrawl is an optional web context provider for Tera.

It is used for:

- URL ingestion
- Clean markdown extraction
- Page summarization
- PDF and webpage parsing where supported by the Firecrawl API

## Environment variables

```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key
WEB_CONTEXT_PROVIDER=firecrawl
```

Optional:

```bash
FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev/v1
```

## What Tera sends

Only public URLs that the user explicitly provides or that are surfaced through a research flow.

Tera does not send:

- private authenticated pages
- localhost or private network URLs
- paywalled content that would require bypassing access controls
- user secrets or local files

## User-visible behavior

- The result includes the original URL
- The result includes a title when available
- The result includes `fetchedAt`
- The result shows `provider: firecrawl`
- The chat UI can show a small source badge when Firecrawl supplied the context

## Limits

- Firecrawl usage should respect the current Tera plan limits
- Free plans should have strict limits
- Pro / Plus can have higher limits
- Admin/dev can be configurable

## Fallback

If Firecrawl fails:

- Tera should return a friendly error
- Tera should suggest pasting text manually
- Tera may fall back to another configured provider when available
- Tera must not crash the chat
