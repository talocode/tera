import { supabaseServer as supabase } from '@/lib/supabase-server'
import { renderProductUpdateEmail, renderProductUpdateText, sendResendEmail } from '@/lib/resend'

export type ProductUpdateAudience = 'all' | 'email_notifications' | 'marketing'

export type ProductUpdateInput = {
  subject: string
  heading: string
  message: string
  previewText?: string
  ctaLabel?: string
  ctaUrl?: string
  audience: ProductUpdateAudience
  dryRun?: boolean
  source?: string
  sourceId?: string
  scheduledAt?: string
}

type ProductUpdateBroadcastRow = {
  id: number
  source: string
  source_id: string
  subject: string
  status: 'scheduled' | 'started' | 'sent' | 'failed' | 'skipped'
  recipient_count: number | null
  sent_count: number | null
  failed_count: number | null
  error_message: string | null
  metadata: Record<string, any> | null
  completed_at: string | null
  scheduled_at: string | null
  created_at: string
}

type Recipient = {
  id: string
  email: string
}

export async function getProductUpdateRecipients(audience: ProductUpdateAudience): Promise<Recipient[]> {
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

export async function logProductUpdateEmail({
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

function buildBroadcastMetadata(input: ProductUpdateInput) {
  return {
    subject: input.subject,
    heading: input.heading,
    message: input.message,
    previewText: input.previewText || null,
    ctaLabel: input.ctaLabel || null,
    ctaUrl: input.ctaUrl || null,
    audience: input.audience,
    source: input.source || 'announcement',
    sourceId: input.sourceId || null,
  }
}

async function upsertBroadcastRecord(input: ProductUpdateInput & { status: ProductUpdateBroadcastRow['status']; scheduledAt?: string | null; recipientCount?: number | null; sentCount?: number | null; failedCount?: number | null; errorMessage?: string | null; completedAt?: string | null }) {
  const source = input.source || 'announcement'
  const sourceId = input.sourceId || `${source}:${input.subject}:${input.scheduledAt || new Date().toISOString()}`
  const { data, error } = await supabase
    .from('product_update_broadcasts')
    .upsert({
      source,
      source_id: sourceId,
      subject: input.subject,
      status: input.status,
      recipient_count: input.recipientCount ?? null,
      sent_count: input.sentCount ?? null,
      failed_count: input.failedCount ?? null,
      error_message: input.errorMessage ?? null,
      metadata: buildBroadcastMetadata(input),
      scheduled_at: input.scheduledAt || null,
      completed_at: input.completedAt || null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[product_update_broadcast_upsert_failed]', { source, sourceId, error })
    throw error
  }

  return data as ProductUpdateBroadcastRow
}

export async function scheduleProductUpdateBroadcast(input: ProductUpdateInput & { scheduledAt: string }) {
  const scheduledAt = new Date(input.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error('Invalid scheduledAt value')
  }

  const row = await upsertBroadcastRecord({
    ...input,
    status: 'scheduled',
    scheduledAt: scheduledAt.toISOString(),
  })

  return {
    ok: true,
    scheduled: true,
    broadcastId: row.id,
    source: row.source,
    sourceId: row.source_id,
    scheduledAt: row.scheduled_at,
  }
}

export async function sendProductUpdateBroadcast(input: ProductUpdateInput) {
  const recipients = await getProductUpdateRecipients(input.audience)

  if (input.dryRun) {
    for (const recipient of recipients.slice(0, 25)) {
      await logProductUpdateEmail({
        userId: recipient.id,
        email: recipient.email,
        subject: input.subject,
        status: 'dry_run',
      })
    }

    return {
      ok: true,
      dryRun: true,
      audience: input.audience,
      recipientCount: recipients.length,
    }
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
      await logProductUpdateEmail({
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
      await logProductUpdateEmail({
        userId: recipient.id,
        email: recipient.email,
        subject: input.subject,
        status: 'failed',
        error: message,
      })
    }
  }

  return {
    ok: results.failed === 0,
    dryRun: false,
    audience: input.audience,
    recipientCount: recipients.length,
    ...results,
    failures: results.failures.slice(0, 25),
  }
}

export async function processScheduledProductUpdateBroadcasts(now = new Date(), limit = 10) {
  const dueAt = now.toISOString()
  const { data: dueBroadcasts, error: dueError } = await supabase
    .from('product_update_broadcasts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', dueAt)
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (dueError) throw dueError
  if (!dueBroadcasts || dueBroadcasts.length === 0) {
    return { ok: true, processed: 0, sent: 0, failed: 0, skipped: 0 }
  }

  const claimIds = dueBroadcasts.map((row: any) => row.id)
  const { data: claimedBroadcasts, error: claimError } = await supabase
    .from('product_update_broadcasts')
    .update({ status: 'started' })
    .in('id', claimIds)
    .eq('status', 'scheduled')
    .select('*')

  if (claimError) throw claimError

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const broadcast of (claimedBroadcasts || []) as ProductUpdateBroadcastRow[]) {
    const metadata = (broadcast.metadata || {}) as Record<string, any>
    const input: ProductUpdateInput = {
      subject: broadcast.subject,
      heading: String(metadata.heading || broadcast.subject),
      message: String(metadata.message || ''),
      previewText: metadata.previewText || undefined,
      ctaLabel: metadata.ctaLabel || undefined,
      ctaUrl: metadata.ctaUrl || undefined,
      audience: (metadata.audience || 'email_notifications') as ProductUpdateAudience,
      source: broadcast.source,
      sourceId: broadcast.source_id,
    }

    try {
      const result = await sendProductUpdateBroadcast(input) as {
        ok: boolean
        dryRun?: boolean
        audience: ProductUpdateAudience
        recipientCount: number
        attempted?: number
        sent?: number
        failed?: number
        failures?: Array<{ email: string; error: string }>
      }

      if (result.dryRun === true) {
        skipped += 1
      } else if (result.ok) {
        sent += 1
      } else {
        failed += 1
      }

      await supabase
        .from('product_update_broadcasts')
        .update({
          status: result.ok ? 'sent' : 'failed',
          recipient_count: result.recipientCount ?? result.attempted ?? null,
          sent_count: result.sent ?? null,
          failed_count: result.failed ?? null,
          error_message: result.ok ? null : (result.failures?.[0]?.error || 'Unknown send failure'),
          completed_at: new Date().toISOString(),
        })
        .eq('id', broadcast.id)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : 'Unknown scheduled broadcast failure'
      await supabase
        .from('product_update_broadcasts')
        .update({
          status: 'failed',
          error_message: message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', broadcast.id)
    }
  }

  return {
    ok: failed === 0,
    processed: claimedBroadcasts?.length || 0,
    sent,
    failed,
    skipped,
  }
}
