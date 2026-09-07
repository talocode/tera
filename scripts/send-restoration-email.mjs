#!/usr/bin/env node

/**
 * Tera restoration update sender.
 * Defaults to a privacy-safe dry run. Set DRY_RUN=false only after approval.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

const DRY_RUN = process.env.DRY_RUN !== 'false'
const SUBJECT = 'Tera is back online'
const DEDUPE_PREFIX = 'service-restored-2026-08-13'
const FROM = process.env.RESEND_FROM_EMAIL || 'TeraAI <updates@updates.teraai.chat>'
const REPLY_TO = 'admin@teraai.chat'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY
const root = path.resolve(import.meta.dirname, '..')

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isKnownHardFailure(message = '') {
  return /hard bounce|invalid recipient|recipient.*not found|mailbox.*unavailable|address.*does not exist/i.test(message)
}

async function supabase(pathname, optional = false) {
  let response
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      })
      break
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000))
    }
  }
  if (!response) throw new Error("Supabase request did not return a response")
  if (!response.ok) {
    if (optional && response.status === 404) return []
    throw new Error(`Supabase request failed (${response.status})`)
  }
  return response.json()
}

async function getRecipients() {
  const users = await supabase('users?select=id,email&email=not.is.null')
  const seen = new Set()
  const invalid = []
  const duplicates = []
  const recipients = []

  for (const user of users) {
    const email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : ''
    if (!isValidEmail(email)) {
      invalid.push(user.id)
      continue
    }
    if (seen.has(email)) {
      duplicates.push(user.id)
      continue
    }
    seen.add(email)
    recipients.push({ id: user.id, email })
  }

  const [transactionalFailures, productFailures, alreadySent] = await Promise.all([
    supabase('transactional_email_events?status=eq.failed&select=email,error_message', true),
    supabase('product_update_emails?status=eq.failed&select=email,error_message', true),
    supabase(`transactional_email_events?status=eq.sent&dedupe_key=like.${encodeURIComponent(`${DEDUPE_PREFIX}*`)}&select=email`, true),
  ])
  const suppressed = new Set(
    [...transactionalFailures, ...productFailures]
      .filter((event) => isKnownHardFailure(event.error_message))
      .map((event) => event.email?.trim().toLowerCase())
      .filter(Boolean),
  )
  const sent = new Set(alreadySent.map((event) => event.email?.trim().toLowerCase()).filter(Boolean))
  const eligible = recipients.filter((recipient) => !suppressed.has(recipient.email) && !sent.has(recipient.email))

  return {
    eligible,
    report: {
      sourceUsers: users.length,
      invalid: invalid.length,
      duplicates: duplicates.length,
      knownHardSuppressions: recipients.filter((recipient) => suppressed.has(recipient.email)).length,
      alreadySent: recipients.filter((recipient) => sent.has(recipient.email)).length,
      eligible: eligible.length,
    },
  }
}

async function logEvent(recipient, status, resendId = null, errorMessage = null) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/transactional_email_events`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: recipient.id,
      email: recipient.email,
      type: 'restoration_update',
      subject: SUBJECT,
      dedupe_key: `${DEDUPE_PREFIX}:${recipient.id}`,
      status,
      resend_id: resendId,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    }),
  })
  if (!response.ok) throw new Error(`Email event logging failed (${response.status})`)
}

async function send(recipient, html, text, logoContent) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: recipient.email,
      subject: SUBJECT,
      html,
      text,
      reply_to: REPLY_TO,
      attachments: [{
        filename: 'tera-logo.png',
        content: logoContent,
        content_id: 'tera-logo',
      }],
    }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || `Email send failed (${response.status})`)
  return body.id || null
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase credentials are required')
  if (!DRY_RUN && !RESEND_API_KEY) throw new Error('RESEND_API_KEY is required for a live send')

  const [html, logo] = await Promise.all([
    fs.readFile(path.join(root, 'email-draft', 'service-restored-email.html'), 'utf8'),
    fs.readFile(path.join(root, 'public', 'images', 'TERA_LOGO_ONLY.png')),
  ])
  if (!html.includes('cid:tera-logo')) throw new Error('Email draft must reference the embedded Tera logo')

  const { eligible, report } = await getRecipients()
  console.log(JSON.stringify({ mode: DRY_RUN ? 'dry-run' : 'live-send', subject: SUBJECT, replyTo: REPLY_TO, ...report }, null, 2))
  if (DRY_RUN) return

  const text = `Tera is back online\n\nHello,\n\nTera is available again at https://teraai.chat\n\nWe know the interruption disrupted your learning and work. We are sorry for the time you lost.\n\nYou can return to your workspace now. If something does not look right, please reply to this email so we can investigate it.\n\nFor help, reply to this email or contact ${REPLY_TO}.\n\nFollow Tera\nX: https://x.com/tryteraai\nYouTube: https://www.youtube.com/@tryteraai\nTelegram: https://t.me/teraaichannel\nThreads: https://www.threads.com/@teraai_\nInstagram: https://instagram.com/teraai_\n\nThank you for your patience and for being part of Tera.\n\nThe Tera Team`
  const logoContent = logo.toString('base64')
  let sent = 0
  let failed = 0
  for (const recipient of eligible) {
    try {
      const resendId = await send(recipient, html, text, logoContent)
      await logEvent(recipient, 'sent', resendId)
      sent += 1
    } catch (error) {
      await logEvent(recipient, 'failed', null, error instanceof Error ? error.message : 'Unknown send failure')
      failed += 1
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  console.log(JSON.stringify({ sent, failed }, null, 2))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
