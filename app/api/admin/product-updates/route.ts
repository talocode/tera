import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/admin'
import { supabaseServer as supabase } from '@/lib/supabase-server'
import { renderProductUpdateEmail, renderProductUpdateText, sendResendEmail } from '@/lib/resend'

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

type Recipient = {
  id: string
  email: string
}

async function getRecipients(audience: 'all' | 'email_notifications' | 'marketing'): Promise<Recipient[]> {
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .not('email', 'is', null)

  if (usersError) throw usersError

  const recipients = (users || [])
    .filter((user: any) => typeof user.email === 'string' && user.email.includes('@'))
    .map((user: any) => ({ id: user.id, email: user.email.toLowerCase() }))

  if (audience === 'all') {
    return recipients
  }

  const userIds = recipients.map((recipient) => recipient.id)
  if (userIds.length === 0) return []

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('user_id, email_notifications, marketing_emails')
    .in('user_id', userIds)

  if (settingsError) throw settingsError

  const settingsByUserId = new Map((settings || []).map((setting: any) => [setting.user_id, setting]))

  return recipients.filter((recipient) => {
    const setting = settingsByUserId.get(recipient.id)
    if (!setting) return audience === 'email_notifications'
    if (audience === 'marketing') return setting.marketing_emails === true
    return setting.email_notifications !== false
  })
}

async function logEmail({
  userId,
  email,
  subject,
  status,
  resendId,
  error,
}: {
  userId: string
  email: string
  subject: string
  status: 'sent' | 'failed' | 'dry_run'
  resendId?: string
  error?: string
}) {
  const { error: insertError } = await supabase
    .from('product_update_emails')
    .insert({
      user_id: userId,
      email,
      subject,
      status,
      resend_id: resendId || null,
      error_message: error || null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })

  if (insertError) {
    console.error('[product_update_email_log_failed]', { email, insertError })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email || !isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const input = productUpdateSchema.parse(await request.json())
    const recipients = await getRecipients(input.audience)

    if (input.dryRun) {
      for (const recipient of recipients.slice(0, 25)) {
        await logEmail({
          userId: recipient.id,
          email: recipient.email,
          subject: input.subject,
          status: 'dry_run',
        })
      }

      return NextResponse.json({
        ok: true,
        dryRun: true,
        audience: input.audience,
        recipientCount: recipients.length,
      })
    }

    const html = renderProductUpdateEmail(input)
    const text = renderProductUpdateText(input)
    const results = {
      attempted: recipients.length,
      sent: 0,
      failed: 0,
      failures: [] as Array<{ email: string; error: string }>,
    }

    for (const recipient of recipients) {
      try {
        const result = await sendResendEmail({
          to: recipient.email,
          subject: input.subject,
          html,
          text,
        })

        results.sent += 1
        await logEmail({
          userId: recipient.id,
          email: recipient.email,
          subject: input.subject,
          status: 'sent',
          resendId: result.id,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown email send failure'
        results.failed += 1
        results.failures.push({ email: recipient.email, error: message })
        await logEmail({
          userId: recipient.id,
          email: recipient.email,
          subject: input.subject,
          status: 'failed',
          error: message,
        })
      }
    }

    return NextResponse.json({
      ok: results.failed === 0,
      audience: input.audience,
      ...results,
      failures: results.failures.slice(0, 25),
    }, { status: results.failed === 0 ? 200 : 207 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid product update payload', issues: error.issues }, { status: 400 })
    }

    console.error('[product_update_broadcast_failed]', error)
    return NextResponse.json({ error: 'Failed to send product update' }, { status: 500 })
  }
}
