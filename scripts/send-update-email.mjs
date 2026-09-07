#!/usr/bin/env node

/**
 * TeraAI — Product Update Email
 * Fetches users from Supabase and sends via Resend.
 *
 * Usage:
 *   node scripts/send-update-email.mjs              # dry run (preview)
 *   DRY_RUN=false node scripts/send-update-email.mjs # actual send
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DRY_RUN = process.env.DRY_RUN !== 'false'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'TeraAI <updates@updates.teraai.chat>'
const REPLY_TO = 'admin@teraai.chat'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const LOGO_URL = `${APP_URL}/assets/tera-logo.jpg`
const SUBJECT = 'What is new on TeraAI'

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderHtml() {
  const safeLogoUrl = escapeHtml(LOGO_URL)
  const safeAppUrl = escapeHtml(APP_URL)
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(SUBJECT)}</title>
  </head>
  <body style="margin:0;background:#0b0f14;color:#f6f7f9;font-family:Inter,Arial,sans-serif;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">New on TeraAI: clearer homepage, token-aligned usage chart, Telegram bot, Gmail integration, and smoother first run.</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#111820;border:1px solid rgba(255,255,255,0.10);border-radius:22px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:36px 32px 8px;">
                <img src="${safeLogoUrl}" alt="TeraAI" width="72" style="border-radius:16px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px;font-size:26px;font-weight:800;">What is new on TeraAI</td>
            </tr>
            <tr>
              <td style="padding:8px 40px 8px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                We have been shipping steadily. Here is what changed on teraai.chat recently.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                <strong style="color:#f6f7f9;">Clearer homepage.</strong> The hero section is easier to read and the main action stands out, so getting started takes seconds.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                <strong style="color:#f6f7f9;">Usage chart aligned to tokens.</strong> Your dashboard now shows exactly what you spend in credits. No more guessing.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                <strong style="color:#f6f7f9;">Telegram bot.</strong> You can now talk to Tera from Telegram, with the same account and credits.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                <strong style="color:#f6f7f9;">Gmail integration and auto-topup.</strong> Connect Gmail, track burn rate, and keep credits topped up automatically.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                <strong style="color:#f6f7f9;">Smoother first run.</strong> New accounts get a guided activation flow instead of a blank screen.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px;font-size:15px;line-height:1.7;color:#c8d0dc;">
                <strong style="color:#f6f7f9;">Talocode ecosystem link.</strong> Discover the open-source tools behind Tera from the sidebar.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 40px;">
                <a href="${safeAppUrl}" style="display:inline-block;background:#38bdf8;color:#04121a;font-weight:800;font-size:16px;padding:14px 36px;border-radius:12px;text-decoration:none;">Open TeraAI</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 36px;font-size:13px;line-height:1.6;color:#8a94a3;">
                You received this because you have a TeraAI account. Reply to this email with feedback, we read everything.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function renderText() {
  return `What is new on TeraAI

We have been shipping steadily. Here is what changed on teraai.chat recently.

- Clearer homepage. The hero section is easier to read and the main action stands out.
- Usage chart aligned to tokens. Your dashboard now shows exactly what you spend in credits.
- Telegram bot. Talk to Tera from Telegram with the same account and credits.
- Gmail integration and auto-topup. Connect Gmail, track burn rate, keep credits topped up.
- Smoother first run. New accounts get a guided activation flow.
- Talocode ecosystem link. Discover the open-source tools behind Tera from the sidebar.

Open TeraAI: ${APP_URL}

You received this because you have a TeraAI account. Reply with feedback, we read everything.`
}

async function fetchUsers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  })
  const users = await res.json()
  return users
    .filter(u => typeof u.email === 'string' && u.email.includes('@'))
    .map(u => ({ id: u.id, email: u.email.toLowerCase() }))
}

async function main() {
  if (!RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY environment variable is required')
    process.exit(1)
  }
  const html = renderHtml()
  const text = renderText()
  const allRecipients = await fetchUsers()
  const OFFSET = parseInt(process.env.OFFSET || '0', 10)
  const recipients = allRecipients.slice(OFFSET)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' Subject: ' + SUBJECT)
  console.log(' From:    ' + FROM_EMAIL)
  console.log(' Reply:   ' + REPLY_TO)
  console.log(' Mode:    ' + (DRY_RUN ? 'DRY RUN' : 'LIVE SEND'))
  console.log(' Recipients:', recipients.length)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (DRY_RUN) {
    console.log('--- Recipients (first 5) ---')
    for (const r of recipients.slice(0, 5)) console.log(`  - ${r.email}`)
    if (recipients.length > 5) console.log(`  ... and ${recipients.length - 5} more`)
    console.log('\nSet DRY_RUN=false to send for real.')
    return
  }

  let sent = 0
  let failed = 0
  for (const recipient of recipients) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: recipient.email, subject: SUBJECT, html, text, reply_to: REPLY_TO }),
      })
      const body = await response.json()
      if (response.ok) {
        sent++
        if (sent <= 5) console.log(`  ✓ ${recipient.email} — id=${body.id}`)
      } else {
        failed++
        console.error(`  ✗ ${recipient.email}: ${body.message || JSON.stringify(body)}`)
      }
    } catch (error) {
      failed++
      console.error(`  ✗ ${recipient.email}: ${error.message}`)
    }
    if ((sent + failed) % 20 === 0) console.log(`  ... ${recipients.length - sent - failed} remaining`)
    await new Promise(r => setTimeout(r, 10))
  }
  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`)
}

main().catch(console.error)
