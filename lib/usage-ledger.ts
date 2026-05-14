import { supabaseServer } from './supabase-server'
import type { PlanType } from './plan-config'

type UsageLedgerEventType = 'chat_generation' | 'credit_blocked' | 'upload'
type UsageLedgerStatus = 'succeeded' | 'blocked' | 'failed'

type UsageLedgerInsert = {
  userId: string
  eventType: UsageLedgerEventType
  status: UsageLedgerStatus
  plan: PlanType
  tool?: string | null
  model?: string | null
  tokenUsage?: number
  creditsCharged?: number
  chatSessionId?: string | null
  sessionId?: string | null
  metadata?: Record<string, unknown>
}

type UsageWindowSummary = {
  creditsCharged: number
  tokenUsage: number
  successfulChats: number
  blockedChats: number
}

function isMissingRelationError(error: unknown, relationName: string) {
  if (!error || typeof error !== 'object') return false

  const details = [
    'message' in error ? error.message : '',
    'details' in error ? error.details : '',
    'hint' in error ? error.hint : '',
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  return details.includes(relationName.toLowerCase()) && (
    details.includes('does not exist')
    || details.includes('relation')
    || details.includes('table')
  )
}

export async function supportsUsageLedger(): Promise<boolean> {
  const { error } = await supabaseServer
    .from('usage_ledger')
    .select('id')
    .limit(1)

  if (!error) return true
  if (isMissingRelationError(error, 'usage_ledger')) return false

  console.error('[usage_ledger_support_check_failed]', error)
  return false
}

export async function recordUsageLedgerEvent(input: UsageLedgerInsert): Promise<boolean> {
  try {
    if (!(await supportsUsageLedger())) {
      return false
    }

    const { error } = await supabaseServer
      .from('usage_ledger')
      .insert({
        user_id: input.userId,
        event_type: input.eventType,
        status: input.status,
        plan: input.plan,
        tool: input.tool ?? null,
        model: input.model ?? null,
        token_usage: Math.max(0, Number(input.tokenUsage || 0)),
        credits_charged: Math.max(0, Number(input.creditsCharged || 0)),
        chat_session_id: input.chatSessionId ?? null,
        session_id: input.sessionId ?? null,
        metadata: input.metadata ?? {},
      })

    if (error) {
      console.error('[usage_ledger_record_failed]', { input, error })
      return false
    }

    return true
  } catch (error) {
    console.error('[usage_ledger_record_exception]', { input, error })
    return false
  }
}

export async function getUsageLedgerWindowSummary(userId: string, windowStart: Date): Promise<UsageWindowSummary | null> {
  try {
    if (!(await supportsUsageLedger())) {
      return null
    }

    const { data, error } = await supabaseServer
      .from('usage_ledger')
      .select('event_type, status, credits_charged, token_usage')
      .eq('user_id', userId)
      .gte('created_at', windowStart.toISOString())

    if (error) {
      console.error('[usage_ledger_window_summary_failed]', { userId, windowStart, error })
      return null
    }

    return (data || []).reduce<UsageWindowSummary>((summary, row: any) => {
      const credits = Math.max(0, Number(row.credits_charged || 0))
      const tokens = Math.max(0, Number(row.token_usage || 0))
      const isChatGeneration = row.event_type === 'chat_generation'
      const isBlocked = row.status === 'blocked' || row.event_type === 'credit_blocked'

      summary.creditsCharged += credits
      summary.tokenUsage += tokens
      if (isChatGeneration && row.status === 'succeeded') summary.successfulChats += 1
      if (isBlocked) summary.blockedChats += 1
      return summary
    }, {
      creditsCharged: 0,
      tokenUsage: 0,
      successfulChats: 0,
      blockedChats: 0,
    })
  } catch (error) {
    console.error('[usage_ledger_window_summary_exception]', { userId, windowStart, error })
    return null
  }
}

export async function getDailyUsageLedgerHistory(userId: string, days: number): Promise<Array<{ date: string; tokens: number; credits: number; chats: number }>> {
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  const emptyHistory: Record<string, { date: string; tokens: number; credits: number; chats: number }> = {}
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = date.toISOString().slice(0, 10)
    emptyHistory[key] = { date: key, tokens: 0, credits: 0, chats: 0 }
  }

  try {
    if (!(await supportsUsageLedger())) {
      return Object.values(emptyHistory)
    }

    const { data, error } = await supabaseServer
      .from('usage_ledger')
      .select('created_at, event_type, status, token_usage, credits_charged')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[usage_ledger_daily_history_failed]', { userId, days, error })
      return Object.values(emptyHistory)
    }

    for (const row of data || []) {
      const key = String(row.created_at).slice(0, 10)
      const bucket = emptyHistory[key]
      if (!bucket) continue

      bucket.tokens += Math.max(0, Number((row as any).token_usage || 0))
      bucket.credits += Math.max(0, Number((row as any).credits_charged || 0))
      if ((row as any).event_type === 'chat_generation' && (row as any).status === 'succeeded') {
        bucket.chats += 1
      }
    }

    return Object.values(emptyHistory)
  } catch (error) {
    console.error('[usage_ledger_daily_history_exception]', { userId, days, error })
    return Object.values(emptyHistory)
  }
}
