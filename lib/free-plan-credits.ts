import { supabaseServer } from './supabase-server'
import type { PlanType } from './plan-config'
import { getUsageLedgerWindowSummary } from './usage-ledger'

const PLAN_MONTHLY_CREDIT_CAPS: Record<PlanType, number> = {
  free: 150,
  pro: 1500,
  plus: 5000
}
const CREDIT_USAGE_CONFIG = {
  resetIntervalDays: 30,
  tokensPerCredit: 5000,
} as const

const RESET_INTERVAL_MS = CREDIT_USAGE_CONFIG.resetIntervalDays * 24 * 60 * 60 * 1000

type CreditState = {
  used: number
  remaining: number
  total: number
  resetDate: string | null
  plan: PlanType
}

type UserCreditRecord = {
  plan: PlanType
  used: number
  purchasedCredits: number
  resetDate: Date | null
  hasCreditLedger: boolean
}

class UsageReadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'UsageReadError'
  }
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const details = [
    'message' in error ? error.message : '',
    'details' in error ? error.details : '',
    'hint' in error ? error.hint : '',
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  return details.includes(columnName.toLowerCase()) && details.includes('column')
}

export function getFreePlanCreditCap() {
  return PLAN_MONTHLY_CREDIT_CAPS.free
}

export function getPlanCreditCap(plan: PlanType): number {
  return PLAN_MONTHLY_CREDIT_CAPS[plan]
}

export function calculateCreditsForTokens(tokenCount: number): number {
  const normalizedTokenCount = Number.isFinite(tokenCount)
    ? Math.max(1, Math.round(tokenCount))
    : 1

  return Math.max(1, Math.ceil(normalizedTokenCount / CREDIT_USAGE_CONFIG.tokensPerCredit))
}

export function getTokensPerCredit() {
  return CREDIT_USAGE_CONFIG.tokensPerCredit
}

function getNextResetDate(from: Date = new Date()) {
  const date = new Date(from)
  date.setDate(date.getDate() + CREDIT_USAGE_CONFIG.resetIntervalDays)
  return date
}

function normalizePlan(plan: string | null | undefined): PlanType {
  if (plan === 'pro' || plan === 'plus') {
    return plan
  }

  return 'free'
}

async function getUserCreditRecord(userId: string): Promise<UserCreditRecord | null> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('subscription_plan, free_plan_credits_used, free_plan_credits_reset_date, purchased_credits_balance')
    .eq('id', userId)
    .maybeSingle()

  if (error && (isMissingColumnError(error, 'free_plan_credits_used') || isMissingColumnError(error, 'free_plan_credits_reset_date') || isMissingColumnError(error, 'purchased_credits_balance'))) {
    const { data: fallbackData, error: fallbackError } = await supabaseServer
      .from('users')
      .select('subscription_plan')
      .eq('id', userId)
      .maybeSingle()

    if (fallbackError) {
      throw new UsageReadError('Unable to read user plan while falling back from missing credit columns.', fallbackError)
    }

    if (!fallbackData) {
      return null
    }

    return {
      plan: normalizePlan(fallbackData.subscription_plan),
      used: 0,
      purchasedCredits: 0,
      resetDate: null,
      hasCreditLedger: false,
    }
  }

  if (error) {
    throw new UsageReadError('Unable to read user credit record.', error)
  }

  if (!data) {
    return null
  }

  return {
    plan: normalizePlan(data.subscription_plan),
    used: Math.max(0, Number(data.free_plan_credits_used || 0)),
    purchasedCredits: Math.max(0, Number(data.purchased_credits_balance || 0)),
    resetDate: data.free_plan_credits_reset_date ? new Date(data.free_plan_credits_reset_date) : null,
    hasCreditLedger: true,
  }
}

async function getUserPlan(userId: string): Promise<PlanType> {
  const { data, error } = await supabaseServer
    .from('users')
    .select('subscription_plan')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new UsageReadError('Unable to read user plan for credit usage.', error)
  }

  if (!data) {
    return 'free'
  }

  return normalizePlan(data.subscription_plan)
}

async function getSessionCreditUsage(userId: string, windowStart: Date): Promise<number> {
  const { data, error } = await supabaseServer
    .from('chat_sessions')
    .select('token_usage')
    .eq('user_id', userId)
    .gte('created_at', windowStart.toISOString())

  if (error && isMissingColumnError(error, 'token_usage')) {
    const { data: fallbackData, error: fallbackError } = await supabaseServer
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', windowStart.toISOString())

    if (fallbackError) {
      throw new UsageReadError('Unable to read chat sessions while falling back from missing token usage column.', fallbackError)
    }

    if (!fallbackData) {
      return 0
    }

    return fallbackData.length
  }

  if (error) {
    throw new UsageReadError('Unable to read session credit usage.', error)
  }

  if (!data) {
    return 0
  }

  return data.reduce((sum: number, row: { token_usage?: number | null }) => (
    sum + calculateCreditsForTokens(Number(row.token_usage || 0))
  ), 0)
}

export async function getUserCreditsRemaining(userId: string): Promise<CreditState> {
  try {
    const now = new Date()
    const record = await getUserCreditRecord(userId)
    const plan = record?.plan ?? await getUserPlan(userId)
    const total = getPlanCreditCap(plan) + Math.max(0, record?.purchasedCredits || 0)

    const activeResetDate = record?.resetDate && now <= record.resetDate
      ? record.resetDate
      : getNextResetDate(now)
    const windowStart = new Date(activeResetDate.getTime() - RESET_INTERVAL_MS)
    const ledgerSummary = await getUsageLedgerWindowSummary(userId, windowStart)
    const ledgerUsage = ledgerSummary?.creditsCharged ?? 0
    const sessionUsage = record?.hasCreditLedger
      ? 0
      : await getSessionCreditUsage(userId, windowStart)
    const storedUsage = record?.resetDate && now <= record.resetDate ? record.used : 0
    const used = ledgerSummary
      ? ledgerUsage
      : (record?.hasCreditLedger ? storedUsage : Math.max(storedUsage, sessionUsage))
    const remaining = Math.max(0, total - used)
    return { used, remaining, total, resetDate: activeResetDate.toISOString(), plan }
  } catch (error) {
    console.error('[credit_usage_read_failed]', { userId, error })
    throw error
  }
}

export async function incrementUserCredits(userId: string, cost: number): Promise<boolean> {
  try {
    const record = await getUserCreditRecord(userId)

    if (!record) {
      console.error('[credit_usage_accounting_failed]', {
        userId,
        cost,
        reason: 'missing_user_credit_record',
      })
      return false
    }

    const now = new Date()
    const resetDate = record.resetDate

    const charge = Math.max(1, cost)
    let used = record.used
    const updatePayload: {
      free_plan_credits_used: number
      free_plan_credits_reset_date?: string
      purchased_credits_balance?: number
    } = { free_plan_credits_used: used }

    if (!resetDate || now > resetDate) {
      used = 0
      const nextReset = getNextResetDate(now)
      updatePayload.free_plan_credits_reset_date = nextReset.toISOString()
    }

    // Consume one-time top-up credits first so spent balance does not reappear on the next reset.
    const purchasedCreditsToConsume = record.hasCreditLedger
      ? Math.min(record.purchasedCredits, charge)
      : 0
    const monthlyCreditsToConsume = charge - purchasedCreditsToConsume

    if (record.hasCreditLedger) {
      updatePayload.purchased_credits_balance = Math.max(0, record.purchasedCredits - purchasedCreditsToConsume)
    }

    updatePayload.free_plan_credits_used = used + monthlyCreditsToConsume

    const { error: updateError } = await supabaseServer
      .from('users')
      .update(updatePayload)
      .eq('id', userId)

    if (updateError) {
      console.error('[credit_usage_accounting_failed]', {
        userId,
        cost,
        reason: 'update_failed',
        error: updateError,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('[credit_usage_accounting_failed]', {
      userId,
      cost,
      reason: 'exception',
      error,
    })
    return false
  }
}

export async function addPurchasedCredits(userId: string, creditsToAdd: number): Promise<boolean> {
  const credits = Math.max(0, Math.floor(Number(creditsToAdd || 0)))
  if (credits <= 0) return false

  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('purchased_credits_balance')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[credit_topup_read_failed]', { userId, error })
      return false
    }

    const nextBalance = Math.max(0, Number(data?.purchased_credits_balance || 0)) + credits
    const { error: updateError } = await supabaseServer
      .from('users')
      .update({ purchased_credits_balance: nextBalance })
      .eq('id', userId)

    if (updateError) {
      console.error('[credit_topup_update_failed]', { userId, credits, error: updateError })
      return false
    }

    return true
  } catch (error) {
    console.error('[credit_topup_failed]', { userId, credits, error })
    return false
  }
}
