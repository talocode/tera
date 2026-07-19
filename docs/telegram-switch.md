# Telegram Bot: Polling ↔ Webhook Switch

## Architecture

- **Polling (current):** Python agent at `python/tera/agent.py` uses `getUpdates` long-polling
- **Webhook (ready):** Next.js route at `app/api/webhooks/telegram/route.ts` receives POST from Telegram

## Prerequisites for Webhook

1. Tera app deployed and reachable at `https://teraai.chat`
2. `TELEGRAM_BOT_TOKEN` set in Netlify environment variables (same as current `.env`)
3. `TALOCODE_API_KEY` set in Netlify environment variables
4. `TELEGRAM_WEBHOOK_URL` set to `https://teraai.chat/api/webhooks/telegram`
5. `MISTRAL_API_KEY` (fallback), `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_CHAT_ID` optional but recommended

## Required Netlify Env Vars

| Variable | Value | Required |
|----------|-------|----------|
| `TELEGRAM_BOT_TOKEN` | `8925272501:AAGlB766R4U9p2xXVW5AoTTnbebLhqAZIs8` | Yes |
| `TALOCODE_API_KEY` | `<your_key>` | For API capabilities |
| `TELEGRAM_WEBHOOK_URL` | `https://teraai.chat/api/webhooks/telegram` | Yes |
| `MISTRAL_API_KEY` | `<your_key>` | Fallback LLM |
| `RESEND_API_KEY` | `<your_key>` | For email capability |
| `RESEND_FROM` | `onboarding@resend.dev` | For email capability |
| `ADMIN_CHAT_ID` | `<your_chat_id>` | For admin commands |
| `TALOCODE_BASE_URL` | `https://api.talocode.site` | Default |

## Switch to Webhook

Run once from any machine with curl:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://teraai.chat/api/webhooks/telegram", "max_connections": 40}'
```

Then stop the Python bot:

```bash
kill $(pgrep -f agent.py)
```

Verify:

```bash
curl -s "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

Expected: `"url": "https://teraai.chat/api/webhooks/telegram"`, `"pending_update_count": 0`

## Rollback to Polling

```bash
# 1. Remove webhook
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook"

# 2. Start Python bot
cd /workspace/projects/tera
bash python/run-bot.sh &

# 3. Verify
curl -s "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
# Expected: "url": ""
```

## State Migration Notes

- The Python bot stores user state in `data/*.json` files (persistent)
- The TypeScript webhook stores state in-memory (`Map`) — state resets on cold start
- To persist state in webhook mode, add Supabase or a JSON blob store
- Auth keys, credits, memory, and calendar events currently live in JSON files only

## Health Check

Once deployed, the webhook health is at:

```
GET https://teraai.chat/api/webhooks/telegram/health
```

Returns bot token status, webhook URL config, and current mode indicator.
