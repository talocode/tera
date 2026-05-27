import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { sendProductUpdateBroadcast } from '@/lib/product-update-broadcast'

const productUpdateSchema = z.object({
  subject: z.string().min(4).max(140),
  heading: z.string().min(4).max(140),
  message: z.string().min(10).max(5000),
  previewText: z.string().max(180).optional(),
  ctaLabel: z.string().max(60).optional(),
  ctaUrl: z.string().url().optional(),
  audience: z.enum(['all', 'email_notifications', 'marketing']).default('email_notifications'),
  dryRun: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input = productUpdateSchema.parse(await request.json())
    const results = await sendProductUpdateBroadcast(input)

    return NextResponse.json(results, { status: results.ok ? 200 : 207 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid product update payload', issues: error.issues }, { status: 400 })
    }

    console.error('[product_update_broadcast_failed]', error)
    return NextResponse.json({ error: 'Failed to send product update' }, { status: 500 })
  }
}
