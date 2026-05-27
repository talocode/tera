type ResendEmailPayload = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

type ResendSendResult = {
  id?: string
}

const RESEND_API_URL = 'https://api.resend.com/emails'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'https://teraai.chat'
}

function getEmailLogoUrl() {
  return `${getAppUrl()}/images/TERA_LOGO_ONLY.png`
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || 'TeraAI <onboarding@resend.dev>'
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && getFromAddress())
}

export async function sendResendEmail(payload: ResendEmailPayload): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo || process.env.RESEND_REPLY_TO_EMAIL,
    }),
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof body?.message === 'string'
      ? body.message
      : `Resend email send failed with status ${response.status}`
    throw new Error(message)
  }

  return body
}

export function renderProductUpdateEmail({
  heading,
  message,
  previewText,
  ctaLabel,
  ctaUrl,
}: {
  heading: string
  message: string
  previewText?: string
  ctaLabel?: string
  ctaUrl?: string
}) {
  const appUrl = getAppUrl()
  const safeHeading = escapeHtml(heading)
  const safeMessage = escapeHtml(message)
  const safePreview = escapeHtml(previewText || heading)
  const safeCtaUrl = escapeHtml(ctaUrl || appUrl)
  const safeCtaLabel = ctaLabel || 'Open Tera'

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
                <p style="margin:0 0 14px;color:#9aa6b2;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Tera update</p>
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
                <p style="margin:0;color:#7f8b98;font-size:12px;line-height:1.6;">You are receiving this because you use Tera. We send product updates when Tera changes in ways that affect your learning workspace.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function renderProductUpdateText({
  heading,
  message,
  ctaUrl,
}: {
  heading: string
  message: string
  ctaUrl?: string
}) {
  const appUrl = getAppUrl()
  return `${heading}\n\n${message}\n\nOpen Tera: ${ctaUrl || appUrl}`
}
