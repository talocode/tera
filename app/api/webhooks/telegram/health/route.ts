import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || ''

  return NextResponse.json({
    status: 'ok',
    service: 'telegram-webhook',
    botTokenSet: !!TG_TOKEN,
    webhookUrlSet: !!webhookUrl,
    webhookUrl: webhookUrl || null,
    mode: webhookUrl ? 'webhook' : 'polling (python)',
    timestamp: new Date().toISOString(),
  })
}
