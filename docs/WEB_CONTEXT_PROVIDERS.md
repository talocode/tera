# Web Context Providers

Tera supports multiple web context providers so research and URL ingestion can adapt to the task and plan level.

## Providers

- `firecrawl`
- `tavily`
- `serpapi`
- `browser`
- `manual`

## Recommended split

- Firecrawl: clean markdown extraction, URL summarization, and document/page ingestion
- Tavily: research search and discovery
- SerpAPI: search fallback where already configured
- Browser: manual or browser-assisted reading flows
- Manual: user-pasted context and excerpts

## Selection

Use `WEB_CONTEXT_PROVIDER` to choose the active provider.

Examples:

```bash
WEB_CONTEXT_PROVIDER=firecrawl
WEB_CONTEXT_PROVIDER=tavily
WEB_CONTEXT_PROVIDER=manual
```

## Safety

- Only public URLs should be sent to a web context provider.
- Private, authenticated, local, and tokenized URLs must not be crawled.
- No provider should bypass robots, paywalls, or access controls.
- Providers should return metadata that makes the source visible to the user.

## Plan usage

- Free: strict limits
- Pro / Plus: higher limits
- Admin / dev: configurable

## Fallback behavior

- If the selected provider fails, Tera may fall back to another configured provider.
- Tera must always show which source provider produced the final result.
- If all providers fail, Tera should suggest manual paste input instead of crashing.
