#!/usr/bin/env node
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'TeraAI <updates@updates.teraai.chat>'
const REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL || 'Teraaiguide@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUBJECT = 'How the $TCODE hold claim works'

const TEXT = `How the $TCODE hold claim works

Holding the official $TCODE mint is how the monthly Talocode Cloud credit claim works.

The credits run the Talocode product APIs. They are usage, not cash. The token is not equity. Do not send $TCODE to Talocode.

One credit is $0.01. Link the wallet that holds the mint, then claim at https://dashboard.talocode.site/billing.

Per UTC month:
1 or more = 1,000 credits
100 or more = 10,000 credits
1,000 or more = 100,000 credits
5,000 or more = 500,000 credits

A $5 top-up is a purchase. A hold is the monthly claim. They are not the same credits.

Official mint only: 6ptxwABxQz8zMhwhiPeVgRgWjGMdVcEBFBv8v8C3ory

You received this because you have a TeraAI account. Reply to this email if you want to be left off the next one.
`

function esc(value) {
  return value.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
}

const paragraphs = TEXT.trim().split(/\n\n/).slice(1).map((block) =>
  `<p style="margin:0 0 16px;color:#c5ced8;font-size:16px;line-height:1.7;">${esc(block).replace(/\n/g, '<br>')}</p>`
).join('')

const HTML = `<!doctype html><html><body style="margin:0;background:#0b0f14;color:#f6f7f9;font-family:Inter,Arial,sans-serif;">
<span style="display:none;opacity:0;height:0;overflow:hidden;">Holding the official mint is the monthly credit claim. A $5 top-up is a separate purchase.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f14;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:640px;background:#111820;border:1px solid rgba(255,255,255,0.10);border-radius:18px;">
<tr><td style="padding:32px 32px 8px;font-size:24px;font-weight:700;">How the $TCODE hold claim works</td></tr>
<tr><td style="padding:8px 32px 8px;">${paragraphs}</td></tr>
<tr><td align="center" style="padding:8px 32px 28px;"><a href="https://dashboard.talocode.site/billing" style="display:inline-block;background:#f6f7f9;color:#111820;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none;">Open the claim page</a></td></tr>
</table></td></tr></table></body></html>`

async function fetchUsers() {
  const recipients = []
  const seen = new Set()
  let offset = 0
  while (true) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email&email=not.is.null&order=id.asc&offset=${offset}&limit=1000`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    const rows = await response.json()
    if (!response.ok || !Array.isArray(rows)) {
      throw new Error('Could not read users')
    }
    for (const row of rows) {
      if (typeof row.email !== 'string' || !row.email.includes('@')) continue
      const email = row.email.trim().toLowerCase()
      if (seen.has(email)) continue
      seen.add(email)
      recipients.push(email)
    }
    if (rows.length < 1000) break
    offset += 1000
  }
  return recipients
}

async function main() {
  if (!RESEND_API_KEY || !SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Missing mail or database configuration')
  }
  const recipients = await fetchUsers()
  console.log('recipients', recipients.length)
  let sent = 0
  let failed = 0
  for (const email of recipients) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: SUBJECT, html: HTML, text: TEXT, reply_to: REPLY_TO }),
    })
    if (response.ok) sent += 1
    else {
      failed += 1
      const body = await response.text()
      if (failed <= 5) console.error('fail', response.status, body.slice(0, 180))
    }
    if ((sent + failed) % 25 === 0) console.log('progress', sent + failed, 'sent', sent, 'failed', failed)
    await new Promise((resolve) => setTimeout(resolve, 120))
  }
  console.log('DONE', sent, failed)
  if (failed > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
