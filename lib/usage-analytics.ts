import { supabaseServer } from './supabase-server'

/**
 * Usage analytics — burn rate, forecast, and daily breakdown.
 */

export type UsageForecast = {
  /** Average credits used per day over the analysis window */
  dailyBurnRate: number
  /** Number of days until credits run out at current rate */
  daysUntilEmpty: number | null
  /** Date when credits will be exhausted */
  projectedExhaustionDate: string | null
  /** Whether the user is on track to run out before reset */
  willExhaustBeforeReset: boolean
  /** Days until next reset */
  daysUntilReset: number | null
  /** Analysis window in days */
  analysisWindowDays: number
  /** Total credits used in the analysis window */
  totalCreditsUsed: number
  /** Daily breakdown for the analysis window */
  dailyBreakdown: Array<{ date: string; credits: number; tokens: number; chats: number }>
}

/**
 * Calculate usage forecast based on recent usage data.
 */
export async function calculateUsageForecast(
  userId: string,
  currentCredits: number,
  resetDate: string | null,
  windowDays: number = 7,
): Promise<UsageForecast> {
  const start = new Date()
  start.setDate(start.getDate() - (windowDays - 1))
  start.setHours(0, 0, 0, 0)

  const emptyHistory: Array<{ date: string; credits: number; tokens: number; chats: number }> = []
  for (let i = 0; i < windowDays; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    emptyHistory.push({
      date: date.toISOString().slice(0, 10),
      credits: 0,
      tokens: 0,
      chats: 0,
    })
  }

  let dailyBreakdown = emptyHistory

  try {
    const { data, error } = await supabaseServer
      .from('usage_ledger')
      .select('created_at, event_type, status, token_usage, credits_charged')
      .eq('user_id', userId)
      .eq('status', 'succeeded')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })

    if (!error && data) {
      const buckets: Record<string, { credits: number; tokens: number; chats: number }> = {}
      for (const bucket of dailyBreakdown) {
        buckets[bucket.date] = bucket
      }

      for (const row of data) {
        const key = String(row.created_at).slice(0, 10)
        const bucket = buckets[key]
        if (!bucket) continue

        bucket.credits += Math.max(0, Number((row as any).credits_charged || 0))
        bucket.tokens += Math.max(0, Number((row as any).token_usage || 0))
        if ((row as any).event_type === 'chat_generation' && (row as any).status === 'succeeded') {
          bucket.chats += 1
        }
      }

      dailyBreakdown = Object.values(buckets)
    }
  } catch (error) {
    console.error('[usage_forecast_query_failed]', { userId, error })
  }

  const totalCreditsUsed = dailyBreakdown.reduce((sum, day) => sum + day.credits, 0)
  const daysWithData = dailyBreakdown.filter((day) => day.credits > 0).length
  const dailyBurnRate = daysWithData > 0 ? totalCreditsUsed / daysWithData : 0

  let daysUntilEmpty: number | null = null
  let projectedExhaustionDate: string | null = null
  if (dailyBurnRate > 0 && currentCredits > 0) {
    daysUntilEmpty = Math.ceil(currentCredits / dailyBurnRate)
    const exhaustDate = new Date()
    exhaustDate.setDate(exhaustDate.getDate() + daysUntilEmpty)
    projectedExhaustionDate = exhaustDate.toISOString().slice(0, 10)
  }

  let daysUntilReset: number | null = null
  let willExhaustBeforeReset = false
  if (resetDate) {
    const reset = new Date(resetDate)
    const now = new Date()
    daysUntilReset = Math.ceil((reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilEmpty !== null && daysUntilReset !== null) {
      willExhaustBeforeReset = daysUntilEmpty < daysUntilReset
    }
  }

  return {
    dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
    daysUntilEmpty,
    projectedExhaustionDate,
    willExhaustBeforeReset,
    daysUntilReset,
    analysisWindowDays: windowDays,
    totalCreditsUsed,
    dailyBreakdown,
  }
}

/**
 * Get per-action usage breakdown for the current billing cycle.
 */
export async function getActionUsageBreakdown(
  userId: string,
  resetDate: string | null,
): Promise<Array<{ action: string; credits: number; count: number }>> {
  const windowStart = resetDate ? new Date(resetDate) : new Date()
  if (resetDate) {
    const resetMs = 30 * 24 * 60 * 60 * 1000
    windowStart.setTime(new Date(resetDate).getTime() - resetMs)
  } else {
    windowStart.setDate(windowStart.getDate() - 30)
  }

  try {
    const { data, error } = await supabaseServer
      .from('usage_ledger')
      .select('event_type, credits_charged')
      .eq('user_id', userId)
      .eq('status', 'succeeded')
      .gte('created_at', windowStart.toISOString())

    if (error || !data) return []

    const breakdown: Record<string, { credits: number; count: number }> = {}
    for (const row of data) {
      const action = (row as any).event_type || 'unknown'
      if (!breakdown[action]) {
        breakdown[action] = { credits: 0, count: 0 }
      }
      breakdown[action].credits += Math.max(0, Number((row as any).credits_charged || 0))
      breakdown[action].count += 1
    }

    return Object.entries(breakdown)
      .map(([action, data]) => ({ action, ...data }))
      .sort((a, b) => b.credits - a.credits)
  } catch (error) {
    console.error('[action_breakdown_query_failed]', { userId, error })
    return []
  }
}
