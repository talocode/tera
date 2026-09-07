# Agent-Readable Public Web

Tera exposes public, server-rendered product information for people, search systems, and AI agents.

## Public discovery

- `https://teraai.chat/llms.txt` lists canonical public pages.
- `https://teraai.chat/llms-full.txt` contains the complete public product brief.
- Public pages support `?format=markdown` and `Accept: text/markdown`.

Examples:

```bash
curl -H 'Accept: text/markdown' https://teraai.chat/ai-learning-companion
curl https://teraai.chat/about?format=markdown
```

Private routes, account data, chat history, notes, and admin surfaces are excluded.

## Traffic review

Review deployment access logs for requests to `llms.txt`, `llms-full.txt`, and markdown representations. Treat server access logs as the source for agent retrieval activity; browser analytics cannot show every non-browser request.

## Event changes

When a public page changes, update `lib/agent-readable-content.ts` in the same change so its markdown representation remains accurate.
