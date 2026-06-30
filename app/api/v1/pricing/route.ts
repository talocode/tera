import { NextResponse } from 'next/server'
import { TERA_API_PRICING } from '@/lib/tera-api/pricing'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    object: 'list',
    currency: 'credits',
    creditUsdValue: 0.01,
    data: Object.entries(TERA_API_PRICING).map(([action, credits]) => ({
      action,
      credits,
      usdValue: credits * 0.01,
    })),
  })
}
