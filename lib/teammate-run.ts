import { supabaseServer } from './supabase-server'
import {
  answerFromSource,
  fetchPublicSource,
  isPublicHttps,
} from './verified-call'

export const TERA_AGENT = {
  name: 'Tera',
  role: 'Finishes one job and returns a receipt.',
}

export type TeammateState = 'pending_approval' | 'rejected' | 'completed'

export type TeammateReceipt = {
  ok: true
  id: string
  agent: typeof TERA_AGENT
  task: string
  source: string | null
  state: TeammateState
  loaded: boolean
  answer: string | null
  creditsCharged: number
  createdAt: string
}

type Row = {
  id: string
  user_id: string
  status: string
  credits_charged: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  tool: string | null
}

function asState(value: unknown): TeammateState | null {
  if (value === 'pending_approval' || value === 'rejected' || value === 'completed') return value
  return null
}

export function toReceipt(row: Row): TeammateReceipt | null {
  const metadata = row.metadata || {}
  const state = asState(metadata.state)
  if (!state || row.tool !== 'teammate') return null
  return {
    ok: true,
    id: row.id,
    agent: TERA_AGENT,
    task: typeof metadata.task === 'string' ? metadata.task : '',
    source: typeof metadata.source === 'string' ? metadata.source : null,
    state,
    loaded: metadata.loaded === true,
    answer: typeof metadata.answer === 'string' ? metadata.answer : null,
    creditsCharged: Math.max(0, Number(row.credits_charged || 0)),
    createdAt: row.created_at,
  }
}

export async function createTeammateRun(input: {
  userId: string
  task: string
  source: string | null
}): Promise<TeammateReceipt | null> {
  const { data, error } = await supabaseServer
    .from('usage_ledger')
    .insert({
      user_id: input.userId,
      event_type: 'chat_generation',
      status: 'blocked',
      plan: 'free',
      tool: 'teammate',
      credits_charged: 0,
      metadata: {
        kind: 'teammate_run',
        state: 'pending_approval',
        task: input.task,
        source: input.source,
        loaded: false,
        answer: null,
        agent: TERA_AGENT,
      },
    })
    .select('id, user_id, status, credits_charged, metadata, created_at, tool')
    .single()
  if (error || !data) {
    console.error('[teammate_run_create_failed]', { userId: input.userId, error })
    return null
  }
  return toReceipt(data as Row)
}

export async function readTeammateRun(id: string, userId: string): Promise<TeammateReceipt | null> {
  const { data, error } = await supabaseServer
    .from('usage_ledger')
    .select('id, user_id, status, credits_charged, metadata, created_at, tool')
    .eq('id', id)
    .maybeSingle()
  if (error || !data || data.user_id !== userId) return null
  return toReceipt(data as Row)
}

export async function updateTeammateRun(input: {
  id: string
  userId: string
  state: TeammateState
  loaded: boolean
  answer: string | null
  creditsCharged: number
  chargedKind: 'teammate_run' | 'verified_call'
}): Promise<TeammateReceipt | null> {
  const current = await readTeammateRun(input.id, input.userId)
  if (!current) return null
  const status = input.state === 'pending_approval'
    ? 'blocked'
    : input.state === 'rejected' || !input.loaded
      ? 'failed'
      : 'succeeded'
  const { data, error } = await supabaseServer
    .from('usage_ledger')
    .update({
      status,
      credits_charged: input.creditsCharged,
      metadata: {
        kind: input.chargedKind,
        state: input.state,
        task: current.task,
        source: current.source,
        loaded: input.loaded,
        answer: input.answer,
        agent: TERA_AGENT,
        teammate: true,
      },
    })
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .select('id, user_id, status, credits_charged, metadata, created_at, tool')
    .single()
  if (error || !data) {
    console.error('[teammate_run_update_failed]', { id: input.id, error })
    return null
  }
  return toReceipt({ ...(data as Row), tool: 'teammate' })
}

export async function finishApprovedRun(source: string | null, task: string): Promise<{
  loaded: boolean
  answer: string | null
}> {
  if (!source || !isPublicHttps(source)) {
    return {
      loaded: false,
      answer: 'This run had no public https source. Nothing ran. You were not charged.',
    }
  }
  const fetched = await fetchPublicSource(source)
  const answer = fetched.text ? answerFromSource(fetched.text, task) : null
  if (!fetched.loaded || !answer) {
    return { loaded: false, answer: 'The source did not load. Nothing was charged.' }
  }
  return { loaded: true, answer }
}
