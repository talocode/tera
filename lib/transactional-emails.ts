import { getPlanCreditCap, getTokensPerCredit } from '@/lib/free-plan-credits'
import type { PlanType } from '@/lib/plan-config'
import { PLAN_CONFIGS } from '@/lib/plan-config'
import { sendResendEmail } from '@/lib/resend'
import { supabaseServer } from '@/lib/supabase-server'

type TransactionalEmailType =
  | 'welcome'
  | 'credit_limit_reached'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'team_invite'

type SendImportantEmailInput = {
  type: TransactionalEmailType
  userId?: string | null
  to: string
  subject: string
  heading: string
  previewText: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
  dedupeKey?: string
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'https://teraai.chat'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getEmailLogoUrl() {
  return `${appUrl()}/images/TERA_LOGO_ONLY.png`
}

function renderImportantEmail({
  heading,
  previewText,
  message,
  ctaLabel,
  ctaUrl,
}: Pick<SendImportantEmailInput, 'heading' | 'previewText' | 'message' | 'ctaLabel' | 'ctaUrl'>) {
  const safeHeading = escapeHtml(heading)
  const safePreview = escapeHtml(previewText)
  const safeMessage = escapeHtml(message)
  const safeCtaUrl = escapeHtml(ctaUrl || appUrl())
  const safeCtaLabel = escapeHtml(ctaLabel || 'Open Tera')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;background:#0b0f14;color:#f6f7f9;font-family:Inter,Arial,sans-serif;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${safePreview}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#111820;border:1px solid rgba(255,255,255,0.10);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;">
                <img src="${escapeHtml(getEmailLogoUrl())}" alt="TeraAI" width="96" height="96" style="display:block;width:48px;height:48px;object-fit:contain;margin:0 0 14px;" />
                <p style="margin:0 0 14px;color:#9aa6b2;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">TeraAI</p>
                <h1 style="margin:0;color:#f6f7f9;font-size:28px;line-height:1.2;font-weight:700;">${safeHeading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 24px;">
                <p style="margin:0;color:#c5ced8;font-size:16px;line-height:1.7;white-space:pre-line;">${safeMessage}</p>
                <a href="${safeCtaUrl}" style="display:inline-block;margin-top:24px;background:#ccff00;color:#08101a;text-decoration:none;font-weight:700;font-size:14px;padding:13px 18px;border-radius:10px;">${safeCtaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px 28px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;color:#7f8b98;font-size:12px;line-height:1.6;">This is a service email about your Tera account, usage, billing, or team access.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

async function logEmail(input: {
  type: TransactionalEmailType
  userId?: string | null
  email: string
  subject: string
  status: 'sent' | 'failed' | 'skipped'
  dedupeKey?: string
  resendId?: string
  error?: string
}) {
  const { error } = await supabaseServer
    .from('transactional_email_events')
    .insert({
      user_id: input.userId || null,
      email: input.email.toLowerCase(),
      type: input.type,
      subject: input.subject,
      dedupe_key: input.dedupeKey || null,
      status: input.status,
      resend_id: input.resendId || null,
      error_message: input.error || null,
      sent_at: input.status === 'sent' ? new Date().toISOString() : null,
    })

  if (error) {
    console.error('[transactional_email_log_failed]', { type: input.type, email: input.email, error })
  }
}

async function hasSentDedupeKey(dedupeKey?: string) {
  if (!dedupeKey) return false

  const { data, error } = await supabaseServer
    .from('transactional_email_events')
    .select('id')
    .eq('dedupe_key', dedupeKey)
    .eq('status', 'sent')
    .maybeSingle()

  if (error) {
    console.error('[transactional_email_dedupe_check_failed]', { dedupeKey, error })
    return false
  }

  return Boolean(data)
}

export async function sendImportantEmail(input: SendImportantEmailInput) {
  if (!input.to || !input.to.includes('@')) {
    return
  }

  if (await hasSentDedupeKey(input.dedupeKey)) {
    await logEmail({
      type: input.type,
      userId: input.userId,
      email: input.to,
      subject: input.subject,
      status: 'skipped',
      dedupeKey: input.dedupeKey,
    })
    return
  }

  try {
    const result = await sendResendEmail({
      to: input.to,
      subject: input.subject,
      html: renderImportantEmail(input),
      text: `${input.heading}\n\n${input.message}\n\n${input.ctaLabel || 'Open Tera'}: ${input.ctaUrl || appUrl()}`,
    })

    await logEmail({
      type: input.type,
      userId: input.userId,
      email: input.to,
      subject: input.subject,
      status: 'sent',
      dedupeKey: input.dedupeKey,
      resendId: result.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email send failure'
    await logEmail({
      type: input.type,
      userId: input.userId,
      email: input.to,
      subject: input.subject,
      status: 'failed',
      dedupeKey: input.dedupeKey,
      error: message,
    })
    console.error('[important_email_failed]', { type: input.type, email: input.to, error })
  }
}

export function sendWelcomeEmail(input: { userId: string; email: string; name?: string | null }) {
  const firstName = input.name?.split(' ')[0] || 'there'

  return sendImportantEmail({
    type: 'welcome',
    userId: input.userId,
    to: input.email,
    subject: 'Welcome to TeraAI',
    heading: `Welcome to Tera, ${firstName}`,
    previewText: 'Your TeraAI account is ready with 150 free credits.',
    message: `Your Tera account is ready. You have 150 free AI credits to learn concepts, research clearly, and build from what you understand.\n\nA credit is currently charged at roughly 1 credit per ${getTokensPerCredit().toLocaleString()} AI tokens, with a minimum of 1 credit per prompt.`,
    ctaLabel: 'Start learning',
    ctaUrl: `${appUrl()}/new`,
    dedupeKey: `welcome:${input.userId}`,
  })
}

export function sendCreditLimitReachedEmail(input: {
  userId: string
  email: string
  plan: PlanType
  resetDate?: string | null
}) {
  const cap = getPlanCreditCap(input.plan)
  const resetLabel = input.resetDate
    ? new Date(input.resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'your next reset date'
  const today = new Date().toISOString().slice(0, 10)

  return sendImportantEmail({
    type: 'credit_limit_reached',
    userId: input.userId,
    to: input.email,
    subject: 'Your Tera credits are used up',
    heading: 'Your Tera credits are used up',
    previewText: 'You can upgrade now or wait for your credits to reset.',
    message: `You have used your ${cap} ${PLAN_CONFIGS[input.plan].displayName} credits for this cycle. You can upgrade for more credits, or continue when your credits reset on ${resetLabel}.`,
    ctaLabel: 'View plans',
    ctaUrl: `${appUrl()}/pricing`,
    dedupeKey: `credit-limit:${input.userId}:${today}`,
  })
}

export function sendSubscriptionStartedEmail(input: {
  userId: string
  email: string
  plan: PlanType
  renewalDate?: string | null
  sourceId?: string | number | null
}) {
  const plan = PLAN_CONFIGS[input.plan]
  const renewal = input.renewalDate
    ? ` Your next renewal date is ${new Date(input.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`
    : ''

  return sendImportantEmail({
    type: 'subscription_started',
    userId: input.userId,
    to: input.email,
    subject: `Your Tera ${plan.displayName} plan is active`,
    heading: `${plan.displayName} is active`,
    previewText: `Your Tera ${plan.displayName} subscription is active.`,
    message: `Your Tera ${plan.displayName} plan is active. You now have ${getPlanCreditCap(input.plan).toLocaleString()} AI credits for the cycle plus the plan features shown in your account.${renewal}`,
    ctaLabel: 'Open profile',
    ctaUrl: `${appUrl()}/profile`,
    dedupeKey: `subscription-started:${input.sourceId || `${input.userId}:${input.plan}`}`,
  })
}

export function sendSubscriptionEndedEmail(input: {
  userId: string
  email: string
  status: 'cancelled' | 'expired'
  sourceId?: string | number | null
}) {
  const isCancelled = input.status === 'cancelled'

  return sendImportantEmail({
    type: isCancelled ? 'subscription_cancelled' : 'subscription_expired',
    userId: input.userId,
    to: input.email,
    subject: isCancelled ? 'Your Tera subscription was cancelled' : 'Your Tera subscription expired',
    heading: isCancelled ? 'Subscription cancelled' : 'Subscription expired',
    previewText: 'Your Tera account has moved back to the free plan.',
    message: isCancelled
      ? 'Your paid Tera subscription has been cancelled and your account has moved back to the free plan. You can reactivate whenever you need higher limits again.'
      : 'Your paid Tera subscription has expired and your account has moved back to the free plan. Update your billing details or choose a plan to restore paid features.',
    ctaLabel: 'Manage plan',
    ctaUrl: `${appUrl()}/pricing`,
    dedupeKey: `subscription-ended:${input.status}:${input.sourceId || input.userId}`,
  })
}

export function sendTeamInviteEmail(input: {
  ownerUserId: string
  ownerEmail?: string | null
  inviteeEmail: string
  role: string
}) {
  return sendImportantEmail({
    type: 'team_invite',
    userId: input.ownerUserId,
    to: input.inviteeEmail,
    subject: 'You were invited to a Tera team',
    heading: 'You were invited to Tera',
    previewText: 'A Tera Plus user invited you to collaborate.',
    message: `${input.ownerEmail || 'A Tera Plus user'} invited you to join their Tera team as ${input.role}. Sign in with this email address to access the shared workspace when team access is available on your account.`,
    ctaLabel: 'Open Tera',
    ctaUrl: `${appUrl()}/auth/signin`,
    dedupeKey: `team-invite:${input.ownerUserId}:${input.inviteeEmail.toLowerCase()}`,
  })
}
