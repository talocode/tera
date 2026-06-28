#!/usr/bin/env node

/**
 * Plan access lockdown tests
 * Run: node scripts/test-plan-lockdown.mjs
 */

import * as fs from 'fs'
import * as path from 'path'

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\n=== Plan Access Lockdown Tests ===\n')

// Test 1: Plan authority module exists
console.log('1. Plan Authority Module')
assert(fs.existsSync('lib/billing/planAuthority.ts'), 'planAuthority.ts exists')
const planAuth = fs.readFileSync('lib/billing/planAuthority.ts', 'utf-8')
assert(planAuth.includes('isTestEmail'), 'Has isTestEmail function')
assert(planAuth.includes('isPlanChangeAllowed'), 'Has isPlanChangeAllowed function')
assert(planAuth.includes('validatePlanFromRequest'), 'Has validatePlanFromRequest function')
assert(planAuth.includes('createPlanChangeAuditEntry'), 'Has audit entry creator')

// Test 2: Test email patterns
console.log('\n2. Test Email Detection')
assert(planAuth.includes('.local'), 'Detects .local emails')
assert(planAuth.includes('codex'), 'Detects codex test emails')
assert(planAuth.includes('test'), 'Detects test emails')
assert(planAuth.includes('example'), 'Detects example emails')
assert(planAuth.includes('dev@'), 'Detects dev@ emails')
assert(planAuth.includes('demo@'), 'Detects demo@ emails')

// Test 3: Production guard
console.log('\n3. Production Guards')
assert(planAuth.includes('NODE_ENV'), 'Checks NODE_ENV for production')
assert(planAuth.includes('production'), 'References production environment')
assert(planAuth.includes('PRODUCTION_ADMIN_ALLOWLIST'), 'Has admin allowlist')

// Test 4: Plan change validation
console.log('\n4. Plan Change Validation')
assert(planAuth.includes('Client requests must not include plan field'), 'Rejects client plan field')
assert(planAuth.includes('Webhook plan changes require a payment reference'), 'Requires payment reference for webhook')
assert(planAuth.includes('Downgrade to free'), 'Allows downgrades')

// Test 5: Billing route has test email guard
console.log('\n5. Billing Route Guards')
const billingRoute = fs.readFileSync('app/api/billing/[...slug]/route.ts', 'utf-8')
assert(billingRoute.includes('isTestEmail'), 'Billing route imports isTestEmail')
assert(billingRoute.includes('Blocked test email'), 'Billing route blocks test emails')
assert(billingRoute.includes('403'), 'Returns 403 for test emails')

// Test 6: Audit script exists
console.log('\n6. Audit Script')
assert(fs.existsSync('scripts/audit-plan-access.mjs'), 'Audit script exists')
const auditScript = fs.readFileSync('scripts/audit-plan-access.mjs', 'utf-8')
assert(auditScript.includes('DRY RUN'), 'Dry-run by default')
assert(auditScript.includes('--fix'), 'Supports --fix flag')
assert(auditScript.includes('TEST_EMAIL'), 'Flags test emails')
assert(auditScript.includes('NO_PAYMENT_REFERENCE'), 'Flags missing payment references')

// Test 7: No plan mutation from client body
console.log('\n7. No Client Plan Mutation')
assert(planAuth.includes('validatePlanFromRequest'), 'Validates plan from request')

// Test 8: Webhook is only safe path
console.log('\n8. Webhook-Only Plan Changes')
assert(planAuth.includes("source !== 'webhook'"), 'Non-webhook sources restricted')
assert(planAuth.includes("'webhook'"), 'Webhook is trusted source')

// Test 9: User creation defaults to free
console.log('\n9. Default Plan is Free')
const authFile = fs.readFileSync('lib/auth.ts', 'utf-8')
assert(authFile.includes("subscription_plan: 'free'"), 'New users get free plan')

// Test 10: No fake AI claims
console.log('\n10. No Unsafe Claims')
const filesToCheck = ['lib/billing/planAuthority.ts', 'scripts/audit-plan-access.mjs']
let noUnsafe = true
const unsafeTerms = ['guaranteed profit', 'guaranteed conversion', 'AI generates images', 'fake payment']
for (const file of filesToCheck) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8').toLowerCase()
    for (const term of unsafeTerms) {
      if (content.includes(term)) {
        noUnsafe = false
        console.log(`  ✗ Unsafe term "${term}" in ${file}`)
      }
    }
  }
}
assert(noUnsafe, 'No unsafe claims')

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
