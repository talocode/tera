#!/usr/bin/env node

/** Report aggregate delivery and engagement for one transactional email campaign. */

import fs from 'node:fs'

const prefix = process.argv[2]
if (!prefix) throw new Error('Usage: node scripts/report-email-engagement.mjs <dedupe-key-prefix>')

function loadEnvironment() {
  const environment = { ...process.env }
  for (const file of ['/workspace/projects/.env', '/workspace/.env']) {
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
      if (match) environment[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
  return environment
}

const env = loadEnvironment()
const baseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!baseUrl || !key) throw new Error('Supabase credentials are required')

const headers = { apikey: key, Authorization: `Bearer ${key}` }
const campaignResponse = await fetch(`${baseUrl}/rest/v1/transactional_email_events?dedupe_key=like.${encodeURIComponent(`${prefix}*`)}&select=status,resend_id`, { headers })
if (!campaignResponse.ok) throw new Error(`Campaign lookup failed (${campaignResponse.status})`)
const campaign = await campaignResponse.json()
const sentIds = new Set(campaign.filter((event) => event.status === 'sent' && event.resend_id).map((event) => event.resend_id))

const deliveryResponse = await fetch(`${baseUrl}/rest/v1/email_delivery_events?select=provider_email_id,event_type`, { headers })
if (!deliveryResponse.ok) throw new Error(`Delivery-event lookup failed (${deliveryResponse.status})`)
const eventTypes = new Map()
for (const event of await deliveryResponse.json()) {
  if (!sentIds.has(event.provider_email_id)) continue
  const set = eventTypes.get(event.event_type) || new Set()
  set.add(event.provider_email_id)
  eventTypes.set(event.event_type, set)
}

const count = (type) => eventTypes.get(type)?.size || 0
const sent = sentIds.size
const opened = count('email.opened')
console.log(JSON.stringify({
  campaign: prefix,
  sent,
  failed: campaign.filter((event) => event.status === 'failed').length,
  delivered: count('email.delivered'),
  opened,
  openRate: sent ? Number((opened / sent * 100).toFixed(1)) : 0,
  clicked: count('email.clicked'),
  bounced: count('email.bounced'),
  complained: count('email.complained'),
  webhookEventsRecorded: [...eventTypes.entries()].reduce((result, [type, ids]) => ({ ...result, [type]: ids.size }), {}),
}, null, 2))
