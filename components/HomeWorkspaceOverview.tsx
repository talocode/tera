'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchCreditUsage, fetchUserSessions, fetchUserUsageSummary } from '@/app/actions/user'
import type { ProfileUsageSummary } from '@/lib/profile-usage'
import { CONTINUE_LATER_CHANGE_EVENT, getContinueLaterOverview } from '@/lib/continue-later'

type SessionPreview = {
  session_id: string
  title?: string | null
  prompt?: string | null
  tool?: string | null
  created_at: string
}

type CreditState = {
  used: number
  remaining: number
  total: number
  resetDate: string | null
  plan: 'free' | 'pro' | 'plus'
}

function formatRemaining(value: number | 'unlimited') {
  return value === 'unlimited' ? 'Unlimited' : value.toLocaleString()
}

function formatResetDate(resetDate: string | null) {
  if (!resetDate) return 'No reset date'
  return new Date(resetDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function summarizeUsage(summary: ProfileUsageSummary | null, credits: CreditState | null) {
  return [
    {
      label: 'Chats',
      value: summary ? formatRemaining(summary.chats.remaining) : '-',
      detail: summary ? `Resets ${formatResetDate(summary.chats.resetAt)}` : 'Usage unavailable',
    },
    {
      label: 'Uploads',
      value: summary ? formatRemaining(summary.uploads.remaining) : '-',
      detail: summary ? `Plan limit ${formatRemaining(summary.uploads.limit)}` : 'Usage unavailable',
    },
    {
      label: 'Web search',
      value: summary ? formatRemaining(summary.webSearches.remaining) : '-',
      detail: summary ? `Resets ${formatResetDate(summary.webSearches.resetAt)}` : 'Usage unavailable',
    },
    {
      label: 'Credits',
      value: credits ? credits.remaining.toLocaleString() : '-',
      detail: credits ? `${credits.used.toLocaleString()} used of ${credits.total.toLocaleString()}` : 'Usage unavailable',
    },
  ]
}

export default function HomeWorkspaceOverview() {
  const { user } = useAuth()
  const [session, setSession] = useState<SessionPreview | null>(null)
  const [usageSummary, setUsageSummary] = useState<ProfileUsageSummary | null>(null)
  const [creditState, setCreditState] = useState<CreditState | null>(null)
  const [overview, setOverview] = useState(() => getContinueLaterOverview())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const refreshOverview = () => setOverview(getContinueLaterOverview())
    window.addEventListener(CONTINUE_LATER_CHANGE_EVENT, refreshOverview)
    window.addEventListener('storage', refreshOverview)
    refreshOverview()

    return () => {
      window.removeEventListener(CONTINUE_LATER_CHANGE_EVENT, refreshOverview)
      window.removeEventListener('storage', refreshOverview)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setSession(null)
          setUsageSummary(null)
          setCreditState(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)

      try {
        const [sessions, summary, credits] = await Promise.all([
          fetchUserSessions(user.id, 1),
          fetchUserUsageSummary(user.id),
          fetchCreditUsage(user.id),
        ])

        if (cancelled) return

        setSession((sessions[0] as SessionPreview | undefined) ?? null)
        setUsageSummary(summary)
        setCreditState(credits)
      } catch (error) {
        console.error('Failed to load home workspace overview:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const usageCards = useMemo(() => summarizeUsage(usageSummary, creditState), [usageSummary, creditState])

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="tera-surface p-6 md:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="tera-eyebrow">Workspace overview</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Resume your flow faster</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
              Tera keeps your latest work, queue, and usage in one place so the next action is obvious.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/new" className="tera-button-primary">
              Start a session
            </Link>
            <Link href="/queue" className="tera-button-secondary">
              Continue later
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {usageCards.map((item) => (
            <div key={item.label} className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-tera-primary">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-tera-secondary">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[22px] border border-white/8 bg-black/10 px-5 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Continue where you left off</p>
              <p className="mt-2 text-lg font-medium text-tera-primary">
                {session ? session.title || 'Untitled session' : 'No recent session found'}
              </p>
            </div>
            {session && (
              <Link href={`/new/${session.session_id}`} className="tera-button-secondary self-start">
                Open latest chat
              </Link>
            )}
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-7 text-tera-secondary">
            {session
              ? session.prompt || 'Pick up this conversation and keep moving.'
              : 'Use a starter template or create a new session to begin.'}
          </p>
          {session && (
            <p className="mt-4 text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">
              Updated {new Date(session.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              {session.tool ? ` - ${session.tool}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="tera-surface p-6">
          <p className="tera-eyebrow">Continue later</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Queued</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.queueCount}</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Reminders</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.reminderCount}</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Due soon</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.dueSoonCount}</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Done</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.archiveCount}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/search" className="tera-button-secondary">
              Search everything
            </Link>
            <Link href="/profile#saved-workflows" className="tera-button-secondary">
              Open workflows
            </Link>
          </div>
        </div>

        <div className="tera-surface p-6">
          <p className="tera-eyebrow">Next best action</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-tera-secondary">
            {loading ? (
              <p>Loading your workspace...</p>
            ) : user?.id ? (
              <>
                <p>
                  Start a new session with a template, open your latest chat, or search across chats, notes, and workflows.
                </p>
                <p>
                  Use the queue when you want to keep unfinished work visible instead of leaving it buried in history.
                </p>
              </>
            ) : (
              <>
                <p>Pick a starter template, try a research prompt, or jump into a new chat without setup.</p>
                <p>Signed-in users get saved memories, queue tracking, and usage visibility on the home screen.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
