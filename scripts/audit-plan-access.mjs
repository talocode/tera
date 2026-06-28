#!/usr/bin/env node

/**
 * Audit Plan Access Script
 * 
 * Lists all Plus/Pro users and flags suspicious ones.
 * Dry-run by default. Use --fix to downgrade suspicious test users.
 * 
 * Usage:
 *   node scripts/audit-plan-access.mjs
 *   node scripts/audit-plan-access.mjs --fix
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const FIX_MODE = process.argv.includes('--fix')

// Test/dev email patterns
const TEST_EMAIL_PATTERNS = [
  /^.*\.local$/i,
  /^codex\.test\./i,
  /^test\./i,
  /^example\./i,
  /^dev@/i,
  /^debug@/i,
  /^demo@/i,
  /^admin@localhost/i,
]

function isTestEmail(email) {
  return TEST_EMAIL_PATTERNS.some((p) => p.test(email))
}

async function main() {
  console.log(`\n=== Plan Access Audit ===`)
  console.log(`Mode: ${FIX_MODE ? 'FIX (will downgrade suspicious users)' : 'DRY RUN (no changes)'}\n`)

  // Fetch all non-free users
  const { data: paidUsers, error } = await supabase
    .from('users')
    .select('id, email, subscription_plan, subscription_status, lemon_squeezy_customer_id, lemon_squeezy_subscription_id, created_at')
    .neq('subscription_plan', 'free')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error.message)
    process.exit(1)
  }

  if (!paidUsers || paidUsers.length === 0) {
    console.log('No paid users found. All users are on Free plan.')
    return
  }

  console.log(`Found ${paidUsers.length} paid user(s):\n`)

  const suspicious = []
  const clean = []

  for (const user of paidUsers) {
    const flags = []

    // Check for test emails
    if (isTestEmail(user.email)) {
      flags.push(`TEST_EMAIL: "${user.email}" matches test/dev pattern`)
    }

    // Check for missing payment reference
    if (!user.lemon_squeezy_customer_id && !user.lemon_squeezy_subscription_id) {
      flags.push('NO_PAYMENT_REFERENCE: No Lemon Squeezy customer or subscription ID')
    }

    // Check for active subscription without subscription ID
    if (user.subscription_status === 'active' && !user.lemon_squeezy_subscription_id) {
      flags.push('ACTIVE_NO_SUBSCRIPTION: Status is active but no subscription ID')
    }

    if (flags.length > 0) {
      suspicious.push({ user, flags })
    } else {
      clean.push(user)
    }
  }

  // Report clean users
  if (clean.length > 0) {
    console.log(`✅ ${clean.length} user(s) look clean:`)
    for (const user of clean) {
      console.log(`  - ${user.email} (${user.subscription_plan}) - customer: ${user.lemon_squeezy_customer_id ? 'yes' : 'no'}`)
    }
    console.log('')
  }

  // Report suspicious users
  if (suspicious.length > 0) {
    console.log(`⚠️  ${suspicious.length} suspicious user(s) flagged:`)
    for (const { user, flags } of suspicious) {
      console.log(`\n  User: ${user.email}`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Plan: ${user.subscription_plan}`)
      console.log(`  Status: ${user.subscription_status || 'none'}`)
      console.log(`  Created: ${user.created_at}`)
      console.log(`  Flags:`)
      for (const flag of flags) {
        console.log(`    - ${flag}`)
      }

      if (FIX_MODE && isTestEmail(user.email)) {
        console.log(`  Action: Would downgrade to free (dry run)`)
      }
    }
    console.log('')
  }

  // Summary
  console.log(`\n=== Summary ===`)
  console.log(`Total paid users: ${paidUsers.length}`)
  console.log(`Clean: ${clean.length}`)
  console.log(`Suspicious: ${suspicious.length}`)

  if (FIX_MODE && suspicious.length > 0) {
    const testUsers = suspicious.filter(({ user }) => isTestEmail(user.email))
    if (testUsers.length > 0) {
      console.log(`\nDowngrading ${testUsers.length} test user(s) to free...`)
      for (const { user } of testUsers) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_plan: 'free',
            subscription_status: 'cancelled',
            subscription_updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          console.error(`  Failed to downgrade ${user.email}: ${updateError.message}`)
        } else {
          console.log(`  ✅ Downgraded ${user.email} to free`)
        }
      }
    } else {
      console.log('\nNo test users to downgrade.')
    }
  }

  if (!FIX_MODE && suspicious.length > 0) {
    console.log('\nRun with --fix to downgrade test users to free.')
  }

  console.log('')
}

main().catch((err) => {
  console.error('Audit failed:', err)
  process.exit(1)
})
