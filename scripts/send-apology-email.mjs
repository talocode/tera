#!/usr/bin/env node

/**
 * TeraAI — Apology & Status Update Email
 * Fetches users from Supabase and sends via Resend.
 * 
 * Usage:
 *   node scripts/send-apology-email.mjs              # dry run (preview)
 *   DRY_RUN=false node scripts/send-apology-email.mjs # actual send
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DRY_RUN = process.env.DRY_RUN !== 'false'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'TeraAI <updates@updates.teraai.chat>'
const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL || 'teraaiguide@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://teraai.chat'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const LOGO_URL = `${APP_URL}/assets/tera-logo.jpg`

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
  const safePricingUrl = escapeHtml(`${APP_URL}/pricing`)
  const safeSettingsUrl = escapeHtml(`${APP_URL}/settings`)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>We are back — TeraAI status update</title>
  </head>
  <body style="margin:0;background:#0b0f14;color:#f6f7f9;font-family:Inter,Arial,sans-serif;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">TeraAI is back online. We apologise for the recent downtime and have credited your account with 200 bonus credits.</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#111820;border:1px solid rgba(255,255,255,0.10);border-radius:22px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px;">
                <img src="${safeLogoUrl}" alt="TeraAI" width="96" height="96" style="display:block;width:52px;height:52px;object-fit:cover;border-radius:12px;margin:0 0 16px;" />
                <p style="margin:0 0 12px;color:#9aa6b2;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">Service update</p>
                <h1 style="margin:0;color:#f6f7f9;font-size:32px;line-height:1.15;font-weight:700;max-width:560px;">We are back. Here is what happened.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;">
                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">Dear TeraAI user,</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">TeraAI experienced an unexpected outage from <strong style="color:#f6f7f9;">July 9 to July 11, 2026</strong>. We know this disrupted your work and study, and we sincerely apologise.</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">The outage occurred because our hosted infrastructure reached its billing limit, and recovery took longer than it should have due to gaps in our deployment pipeline. This is our responsibility, and we have taken steps to ensure it does not happen again.</p>

                <h2 style="margin:24px 0 12px;color:#f6f7f9;font-size:20px;line-height:1.3;font-weight:700;">What we have fixed</h2>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">&bull; Proactive billing alerts — our infrastructure now notifies us before any billing limit is reached.<br />
                &bull; Hardened deployment pipeline — recovery procedures have been automated and tested.<br />
                &bull; End-to-end validation — API and frontend are continuously verified.</p>

                <h2 style="margin:24px 0 12px;color:#f6f7f9;font-size:20px;line-height:1.3;font-weight:700;">Our commitment to you</h2>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">As a gesture of accountability, we have <strong style="color:#f6f7f9;">reset every account's usage credits</strong> and added a <strong style="color:#f6f7f9;">bonus of 200 additional credits</strong> to give you more room to keep learning and exploring. No action is needed on your part — the credits have been applied to your account.</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">You can verify your updated credit balance at any time from your <a href="${safeSettingsUrl}" style="color:#7bb8ff;text-decoration:underline;">account settings</a>.</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">Trust is built by being honest about mistakes and transparent about fixes. We are committed to earning yours back.</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">If you have questions or run into any issues, please reply to this email or reach out to <a href="mailto:support@teraai.chat" style="color:#7bb8ff;text-decoration:underline;">support@teraai.chat</a>. We read every message.</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">Thank you for your patience and for being part of TeraAI.</p>

                <p style="margin:0 0 16px;color:#c5ced8;font-size:17px;line-height:1.85;">Sincerely,<br />The TeraAI Team</p>

                <div style="margin-top:28px;">
                  <a href="${safeAppUrl}" style="display:inline-block;background:#f6f7f9;color:#08101a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);">Open TeraAI</a>
                  <span style="display:inline-block;width:12px;"></span>
                  <a href="${safePricingUrl}" style="display:inline-block;background:transparent;color:#c5ced8;text-decoration:none;font-weight:600;font-size:15px;padding:14px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);">View plans</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 30px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;color:#7f8b98;font-size:12px;line-height:1.7;">You are receiving this because you have a TeraAI account and email notifications are enabled. If you would like to update your preferences, visit <a href="${safeSettingsUrl}" style="color:#7bb8ff;text-decoration:underline;">account settings</a>.</p>
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
  return `TERAAI — SERVICE UPDATE

We are back. Here is what happened.

Dear TeraAI user,

TeraAI experienced an unexpected outage from July 9 to July 11, 2026. We know this disrupted your work and study, and we sincerely apologise.

The outage occurred because our hosted infrastructure reached its billing limit, and recovery took longer than it should have due to gaps in our deployment pipeline. This is our responsibility, and we have taken steps to ensure it does not happen again.

What we have fixed:
- Proactive billing alerts — our infrastructure now notifies us before any billing limit is reached.
- Hardened deployment pipeline — recovery procedures have been automated and tested.
- End-to-end validation — API and frontend are continuously verified.

Our commitment to you:
As a gesture of accountability, we have reset every account's usage credits and added a bonus of 200 additional credits to give you more room to keep learning and exploring. No action is needed on your part — the credits have been applied to your account.

You can verify your updated credit balance at any time from your account settings: ${APP_URL}/settings

Trust is built by being honest about mistakes and transparent about fixes. We are committed to earning yours back.

If you have questions or run into any issues, please reply to this email or reach out to support@teraai.chat.

Thank you for your patience and for being part of TeraAI.

Sincerely,
The TeraAI Team

Open TeraAI: ${APP_URL}
View plans: ${APP_URL}/pricing`
}

async function fetchUsers() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    const emails = process.env.USER_EMAILS
    if (emails) return emails.split(',').map(e => ({ id: 'manual', email: e.trim() }))
    return [{ id: 'preview', email: 'preview@teraai.chat' }]
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
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
  const recipients = await fetchUsers()

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(' Subject: We are back — TeraAI status update')
  console.log(' From:   ', FROM_EMAIL)
  console.log(' Reply:  ', REPLY_TO)
  console.log(' Mode:   ', DRY_RUN ? 'DRY RUN' : 'LIVE SEND')
  console.log(' Recipients:', recipients.length)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (DRY_RUN) {
    console.log('\n--- PLAIN TEXT ---')
    console.log(text)
    console.log('\n--- Recipients (first 5) ---')
    for (const r of recipients.slice(0, 5)) {
      console.log(`  - ${r.email}`)
    }
    if (recipients.length > 5) {
      console.log(`  ... and ${recipients.length - 5} more`)
    }
    console.log('\nSet DRY_RUN=false to send for real.')
    return
  }

  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: recipient.email,
          subject: 'We are back — TeraAI status update',
          html,
          text,
          reply_to: REPLY_TO,
        }),
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

    if (sent > 5 && failed === 0) {
      // Progress indicator after first 5
      const remaining = recipients.length - sent - failed
      if (remaining > 0 && (sent + failed) % 20 === 0) {
        console.log(`  ... ${remaining} remaining`)
      }
    }

    // Rate limit: 10ms between sends
    await new Promise(r => setTimeout(r, 10))
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`)
}

main().catch(console.error)
