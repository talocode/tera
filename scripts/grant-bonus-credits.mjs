#!/usr/bin/env node

/**
 * Grant 200 bonus credits + reset usage to all TeraAI users.
 * 
 * Usage:
 *   node scripts/grant-bonus-credits.mjs          # dry run
 *   DRY_RUN=false node scripts/grant-bonus-credits.mjs  # actual grant
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.env.DRY_RUN !== 'false'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function query(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })
  return response
}

async function main() {
  // Count users first
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  })
  const countHeader = countRes.headers.get('content-range')
  console.log(`Users: ${countHeader || 'checking...'}`)

  // Get all users
  const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,free_plan_credits_used,purchased_credits_balance,free_plan_credits_reset_date`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  })
  const users = await usersRes.json()
  console.log(`Found ${users.length} users\n`)

  // Show current state for first 5
  console.log('=== Current State (first 5) ===')
  for (const u of users.slice(0, 5)) {
    console.log(`  ${u.email || 'no-email'}: used=${u.free_plan_credits_used}, purchased=${u.purchased_credits_balance}, reset=${(u.free_plan_credits_reset_date || '').slice(0, 10)}`)
  }
  if (users.length > 5) console.log(`  ... and ${users.length - 5} more`)

  if (DRY_RUN) {
    console.log('\n[Dry Run] Would execute:')
    console.log('  1. Reset free_plan_credits_used = 0')
    console.log('  2. Add 200 to purchased_credits_balance')
    console.log('  3. Extend free_plan_credits_reset_date by 30 days')
    console.log(`\n  Affected: ${users.length} users`)
    console.log('\nSet DRY_RUN=false to apply.')
    return
  }

  // Apply via direct SQL (using the management API)
  console.log('\n=== Applying bonus credits ===')
  
  let updated = 0
  let errors = 0

  for (const user of users) {
    try {
      const newResetDate = new Date()
      newResetDate.setDate(newResetDate.getDate() + 30)

      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          free_plan_credits_used: 0,
          purchased_credits_balance: (user.purchased_credits_balance || 0) + 200,
          free_plan_credits_reset_date: newResetDate.toISOString(),
        }),
      })

      if (res.ok) {
        updated++
        const display = user.email || user.id.slice(0, 8)
        if (updated <= 5) console.log(`  ✓ ${display}: reset + 200 bonus`)
      } else {
        errors++
        console.error(`  ✗ ${user.id}: ${res.status} ${await res.text().catch(() => '')}`)
      }
    } catch (err) {
      errors++
      console.error(`  ✗ ${user.id}: ${err.message}`)
    }

    // Rate limit: small delay between updates
    await new Promise(r => setTimeout(r, 50))
  }

  console.log(`\nDone. Updated: ${updated}/${users.length}, Errors: ${errors}`)
}

main().catch(console.error)
