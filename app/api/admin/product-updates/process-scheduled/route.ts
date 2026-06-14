import { NextRequest, NextResponse } from 'next/server'
import { processScheduledProductUpdateBroadcasts } from '@/lib/product-update-broadcast'

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
    const expected = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await processScheduledProductUpdateBroadcasts()
    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('[scheduled_product_update_processing_failed]', error)
    const message = error instanceof Error ? error.message : 'Failed to process scheduled product updates'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
