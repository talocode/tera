#!/usr/bin/env node

import fs from 'node:fs'

function loadEnvFile(filePath) {
  const values = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
  return values
}

const env = { ...loadEnvFile(new URL('../.env', import.meta.url)), ...process.env }
env.SUPABASE_URL ||= env.NEXT_PUBLIC_SUPABASE_URL
for (const key of ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!env[key]) throw new Error(`${key} is required`)
}

const subject = 'Tera is temporarily unavailable'
const html = fs.readFileSync(new URL('../email-draft/tera-certificate-outage-sponsorship.html', import.meta.url), 'utf8')
const text = `Tera is temporarily unavailable\n\nTera is temporarily unavailable while we renew its security certificate.\n\nYour account data has not been lost. We are working to restore secure access and will send another update as soon as Tera is available again.\n\nTera is built by the Talocode team, founded by Engineer Abdulmuiz Adeyemo. Talocode: https://talocode.site\n\nOptional sponsorship: https://github.com/sponsors/Abdulmuiz44\n\nEngineer Abdulmuiz Adeyemo on X: https://x.com/AbdMuizAdeyemo\nTera on X: https://x.com/tryteraai\nTera on YouTube: https://www.youtube.com/@tryteraai\n\nThere is no obligation to contribute. Thank you for your patience and support.`

const recipients = []
for (let offset = 0; ; offset += 1000) {
  const usersResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/users?select=id,email&order=id.asc&offset=${offset}&limit=1000`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
  })
  if (!usersResponse.ok) throw new Error('Could not load Tera recipients')
  const page = await usersResponse.json()
  recipients.push(...page.filter((user) => typeof user.email === 'string' && user.email.includes('@')))
  if (page.length < 1000) break
}

let sent = 0
let failed = 0
for (const recipient of recipients) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.RESEND_FROM_EMAIL, to: recipient.email, subject, html, text, reply_to: 'admin@teraai.chat' }),
  })
  if (response.ok) sent += 1
  else {
    failed += 1
    if (failed === 1) {
      const body = await response.json().catch(() => ({}))
      console.error(JSON.stringify({ firstFailureStatus: response.status, firstFailureMessage: body.message || body.name || 'Email provider rejected the request' }))
    }
  }
}

console.log(JSON.stringify({ attempted: recipients.length, sent, failed }))
