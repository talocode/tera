/**
 * Plan Authority Module
 * 
 * Central authority for plan mutations in TeraAI.
 * Ensures plans can only be granted through verified server-side paths.
 * 
 * Rules:
 * - Free is default for all new users
 * - Plus/Pro can only be granted from verified payment/subscription records
 * - Client request body must never directly set plan
 * - Test/dev emails cannot receive paid plans in production
 * - Admin overrides are blocked in production unless explicitly allowlisted
 */

export type PlanType = 'free' | 'pro' | 'plus'

// Test/dev email patterns that should never get paid plans in production
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

// Admin allowlist - only these user IDs can override plans in production
// Empty by default = no admin overrides in production
const PRODUCTION_ADMIN_ALLOWLIST: string[] = []

export interface PlanChangeAuditEntry {
  userId: string
  email: string
  oldPlan: PlanType
  newPlan: PlanType
  reason: string
  source: string
  paymentReference?: string
  actorId?: string
  createdAt: string
}

/**
 * Check if an email matches test/dev patterns
 */
export function isTestEmail(email: string): boolean {
  return TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(email))
}

/**
 * Check if a plan change is allowed
 * 
 * @param currentPlan - User's current plan
 * @param requestedPlan - Plan being requested
 * @param source - Where the change is coming from (e.g., 'webhook', 'admin', 'api')
 * @param email - User's email
 * @param actorId - Who is requesting the change (for admin overrides)
 * @param paymentReference - Payment/subscription reference (for webhook changes)
 * @returns Object with allowed status and reason
 */
export function isPlanChangeAllowed(params: {
  currentPlan: PlanType
  requestedPlan: PlanType
  source: string
  email: string
  actorId?: string
  paymentReference?: string
}): { allowed: boolean; reason: string } {
  const { currentPlan, requestedPlan, source, email, actorId, paymentReference } = params

  // No change needed
  if (currentPlan === requestedPlan) {
    return { allowed: true, reason: 'Plan unchanged' }
  }

  // Downgrades are always allowed (cancellation, expiry)
  if (requestedPlan === 'free') {
    return { allowed: true, reason: 'Downgrade to free' }
  }

  // Test emails cannot get paid plans in production
  if (process.env.NODE_ENV === 'production' && isTestEmail(email)) {
    return {
      allowed: false,
      reason: `Test/dev email "${email}" cannot receive paid plan status in production`,
    }
  }

  // Only verified webhook changes can grant paid plans
  if (source !== 'webhook') {
    // Check for admin override in production
    if (process.env.NODE_ENV === 'production') {
      if (!actorId) {
        return {
          allowed: false,
          reason: 'Paid plan changes require verified payment records in production',
        }
      }

      if (!PRODUCTION_ADMIN_ALLOWLIST.includes(actorId)) {
        return {
          allowed: false,
          reason: `Actor "${actorId}" is not in the production admin allowlist`,
        }
      }
    }
  }

  // Webhook changes require a payment reference
  if (source === 'webhook' && !paymentReference) {
    return {
      allowed: false,
      reason: 'Webhook plan changes require a payment reference',
    }
  }

  return { allowed: true, reason: 'Plan change allowed' }
}

/**
 * Validate a plan value from request body
 * Returns null if valid, or an error message if invalid
 */
export function validatePlanFromRequest(plan: unknown): string | null {
  if (plan === undefined || plan === null) return null // No plan in request is fine
  if (typeof plan !== 'string') return 'Plan must be a string'
  if (!['free', 'pro', 'plus'].includes(plan)) {
    return `Invalid plan value: "${plan}". Must be "free", "pro", or "plus".`
  }
  // Client should never set plan directly
  return 'Client requests must not include plan field. Plan is set server-side only.'
}

/**
 * Log a plan change for audit purposes
 */
export function createPlanChangeAuditEntry(params: {
  userId: string
  email: string
  oldPlan: PlanType
  newPlan: PlanType
  reason: string
  source: string
  paymentReference?: string
  actorId?: string
}): PlanChangeAuditEntry {
  return {
    ...params,
    createdAt: new Date().toISOString(),
  }
}
