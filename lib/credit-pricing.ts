/**
 * Per-action credit pricing configuration.
 * Each Tera feature has a defined credit cost.
 * Tokens are also converted to credits at a fixed rate.
 */

export type ActionType =
  | 'chat_generation'
  | 'file_upload'
  | 'web_search'
  | 'deep_research'
  | 'code_review'
  | 'code_explain'
  | 'writing_rewrite'
  | 'writing_draft'
  | 'image_generation'
  | 'export_pdf'
  | 'export_word'

export type ActionPricing = {
  /** Fixed credit cost for the action (0 = use token-based pricing) */
  baseCredits: number
  /** Human-readable label */
  label: string
  /** Whether this action uses token-based pricing in addition to base cost */
  usesTokens: boolean
  /** Whether this action is available on the free plan */
  freePlan: boolean
  /** Minimum credits required to perform this action */
  minCredits: number
}

/**
 * Credit pricing table — mirrors Netlify-style per-action pricing.
 * Each action costs a fixed number of credits.
 * For chat_generation, tokens are also factored in.
 */
export const CREDIT_PRICING: Record<ActionType, ActionPricing> = {
  chat_generation: {
    baseCredits: 3,
    label: 'AI Chat',
    usesTokens: true,
    freePlan: true,
    minCredits: 1,
  },
  file_upload: {
    baseCredits: 2,
    label: 'File Upload',
    usesTokens: false,
    freePlan: true,
    minCredits: 1,
  },
  web_search: {
    baseCredits: 5,
    label: 'Web Search',
    usesTokens: false,
    freePlan: true,
    minCredits: 1,
  },
  deep_research: {
    baseCredits: 15,
    label: 'Deep Research',
    usesTokens: true,
    freePlan: false,
    minCredits: 5,
  },
  code_review: {
    baseCredits: 10,
    label: 'Code Review',
    usesTokens: true,
    freePlan: true,
    minCredits: 3,
  },
  code_explain: {
    baseCredits: 5,
    label: 'Code Explain',
    usesTokens: true,
    freePlan: true,
    minCredits: 2,
  },
  writing_rewrite: {
    baseCredits: 5,
    label: 'Rewrite',
    usesTokens: true,
    freePlan: true,
    minCredits: 2,
  },
  writing_draft: {
    baseCredits: 8,
    label: 'Draft Content',
    usesTokens: true,
    freePlan: true,
    minCredits: 3,
  },
  image_generation: {
    baseCredits: 10,
    label: 'Image Generation',
    usesTokens: false,
    freePlan: false,
    minCredits: 5,
  },
  export_pdf: {
    baseCredits: 3,
    label: 'Export PDF',
    usesTokens: false,
    freePlan: false,
    minCredits: 1,
  },
  export_word: {
    baseCredits: 3,
    label: 'Export Word',
    usesTokens: false,
    freePlan: false,
    minCredits: 1,
  },
}

/** Token conversion rate used when usesTokens is true */
export const TOKENS_PER_CREDIT = 5000

/**
 * Calculate the total credit cost for an action.
 * For token-based actions: baseCredits + ceil(tokens / TOKENS_PER_CREDIT)
 * For fixed actions: baseCredits only
 */
export function calculateActionCredits(
  action: ActionType,
  tokenCount: number = 0,
): number {
  const pricing = CREDIT_PRICING[action]
  if (!pricing) return 1

  if (pricing.usesTokens && tokenCount > 0) {
    const tokenCredits = Math.max(1, Math.ceil(tokenCount / TOKENS_PER_CREDIT))
    return pricing.baseCredits + tokenCredits
  }

  return pricing.baseCredits
}

/**
 * Check if a user can afford an action given their remaining credits.
 */
export function canAffordAction(
  action: ActionType,
  remainingCredits: number,
): boolean {
  const pricing = CREDIT_PRICING[action]
  if (!pricing) return false
  return remainingCredits >= pricing.minCredits
}

/**
 * Get all actions available for a plan.
 */
export function getAvailableActions(plan: 'free' | 'pro' | 'plus'): ActionType[] {
  return (Object.keys(CREDIT_PRICING) as ActionType[]).filter(
    (action) => CREDIT_PRICING[action].freePlan || plan !== 'free'
  )
}

/**
 * Get a summary of all action costs for display.
 */
export function getPricingTable(): Array<{
  action: ActionType
  label: string
  credits: number
  usesTokens: boolean
  freePlan: boolean
}> {
  return (Object.keys(CREDIT_PRICING) as ActionType[]).map((action) => ({
    action,
    label: CREDIT_PRICING[action].label,
    credits: CREDIT_PRICING[action].baseCredits,
    usesTokens: CREDIT_PRICING[action].usesTokens,
    freePlan: CREDIT_PRICING[action].freePlan,
  }))
}
