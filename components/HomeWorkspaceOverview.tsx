'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchCreditUsage, fetchUserSessions, fetchUserUsageSummary } from '@/app/actions/user'
import { fetchNotes as fetchWorkspaceNotes, type Note } from '@/app/actions/notes'
import { getBookmarks, type SearchBookmark } from '@/app/actions/search'
import type { ProfileUsageSummary } from '@/lib/profile-usage'
import { CONTINUE_LATER_CHANGE_EVENT, getContinueLaterOverview } from '@/lib/continue-later'
import { loadSavedWorkflows } from '@/lib/saved-workflows'

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

type RecentItem =
  | {
      kind: 'note'
      id: string
      title: string
      excerpt: string
      href: string
      timestamp: string
    }

type BookmarkItem = {
  id: string
  title: string
  url: string
  snippet: string
  source: string
  createdAt: string
}
  | {
      kind: 'workflow'
      id: string
      title: string
      excerpt: string
      href: string
      timestamp: string
    }

type OnboardingTask = {
  label: string
  description: string
  href: string
  done: boolean
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
  const [sessionCount, setSessionCount] = useState(0)
  const [noteCount, setNoteCount] = useState(0)
  const [workflowCount, setWorkflowCount] = useState(0)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [recentBookmarks, setRecentBookmarks] = useState<BookmarkItem[]>([])
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
          setSessionCount(0)
          setNoteCount(0)
          setWorkflowCount(0)
          setRecentItems([])
          setRecentBookmarks([])
          setUsageSummary(null)
          setCreditState(null)
          setLoading(false)
        }
        return
      }

      setLoading(true)

      try {
        const [sessions, notes, bookmarks, summary, credits] = await Promise.all([
          fetchUserSessions(user.id, 1),
          fetchWorkspaceNotes(user.id),
          getBookmarks(user.id, 3),
          fetchUserUsageSummary(user.id),
          fetchCreditUsage(user.id),
        ])

        if (cancelled) return

        setSession((sessions[0] as SessionPreview | undefined) ?? null)
        const workflows = loadSavedWorkflows()
        setSessionCount(sessions.length)
        setNoteCount((notes as Note[]).length)
        setWorkflowCount(workflows.length)
        const recentNoteItems = (notes as Note[]).slice(0, 2).map((note) => ({
          kind: 'note' as const,
          id: note.id,
          title: 'Note',
          excerpt: note.content,
          href: '/notes',
          timestamp: note.updated_at,
        }))
        const recentWorkflowItems = workflows.slice(0, 2).map((workflow) => ({
          kind: 'workflow' as const,
          id: workflow.id,
          title: workflow.name,
          excerpt: workflow.prompt,
          href: `/new?prompt=${encodeURIComponent(workflow.prompt)}`,
          timestamp: workflow.createdAt,
        }))
        setRecentItems([...recentNoteItems, ...recentWorkflowItems].slice(0, 4))
        setRecentBookmarks((bookmarks as SearchBookmark[]).slice(0, 3).map((bookmark) => ({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          snippet: bookmark.snippet,
          source: bookmark.source,
          createdAt: bookmark.createdAt,
        })))
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
  const onboardingTasks = useMemo<OnboardingTask[]>(() => {
    const hasSessions = sessionCount > 0
    const hasNotes = noteCount > 0
    const hasWorkflows = workflowCount > 0
    const hasQueue = overview.queueCount > 0 || overview.reminderCount > 0

    return [
      {
        label: 'Start a session',
        description: 'Open a fresh chat or reuse a starter template.',
        href: '/new',
        done: hasSessions,
      },
      {
        label: 'Save a note',
        description: 'Capture a useful idea before it disappears.',
        href: '/notes',
        done: hasNotes,
      },
      {
        label: 'Save a workflow',
        description: 'Turn a repeated prompt into a one-click action.',
        href: '/profile#saved-workflows',
        done: hasWorkflows,
      },
      {
        label: 'Use continue later',
        description: 'Pin unfinished work or add a reminder to come back.',
        href: '/queue',
        done: hasQueue,
      },
    ]
  }, [noteCount, overview.queueCount, overview.reminderCount, sessionCount, workflowCount])

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
            <div key={item.label} className="tera-card-subtle px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-tera-primary">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-tera-secondary">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 tera-surface-muted px-5 py-5">
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
            <div className="tera-card-subtle px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Queued</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.queueCount}</p>
            </div>
            <div className="tera-card-subtle px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Reminders</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.reminderCount}</p>
            </div>
            <div className="tera-card-subtle px-4 py-4">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Due soon</p>
              <p className="mt-2 text-2xl font-semibold text-tera-primary">{overview.dueSoonCount}</p>
            </div>
            <div className="tera-card-subtle px-4 py-4">
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

        <div className="mt-6 tera-surface-muted px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Recent bookmarks</p>
              <p className="mt-2 text-lg font-medium text-tera-primary">Saved research sources</p>
            </div>
            <Link href="/bookmarks" className="tera-button-secondary">
              Open bookmarks
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentBookmarks.length === 0 ? (
              <p className="text-sm leading-7 text-tera-secondary">
                No saved research sources yet. Save a citation from research mode to keep it here.
              </p>
            ) : (
              recentBookmarks.map((bookmark) => (
                <a
                  key={bookmark.id}
                  href={bookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[18px] border border-tera-border bg-tera-muted px-4 py-4 transition hover:-translate-y-px hover:bg-tera-highlight"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-tera-primary">{bookmark.title}</p>
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">
                      {new Date(bookmark.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{bookmark.snippet}</p>
                  <p className="mt-3 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">{bookmark.source}</p>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 tera-surface-muted px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Getting started</p>
              <p className="mt-2 text-lg font-medium text-tera-primary">Complete the core loops once</p>
            </div>
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">
              {onboardingTasks.filter((task) => task.done).length}/{onboardingTasks.length} done
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {onboardingTasks.map((task) => (
              <Link
                key={task.label}
                href={task.href}
                className="flex items-start justify-between gap-4 rounded-[18px] border border-tera-border bg-tera-muted px-4 py-4 transition hover:-translate-y-px hover:bg-tera-highlight"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-tera-primary">{task.label}</p>
                  <p className="mt-1 text-sm leading-6 text-tera-secondary">{task.description}</p>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-full border px-2 py-1 text-[0.55rem] uppercase tracking-[0.18em]',
                    task.done ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-tera-border bg-tera-muted text-tera-secondary',
                ].join(' ')}
              >
                  {task.done ? 'Done' : 'Open'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 tera-surface-muted px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">Recent work</p>
              <p className="mt-2 text-lg font-medium text-tera-primary">Notes and workflows you can reopen</p>
            </div>
            <Link href="/search" className="tera-button-secondary">
              Search all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentItems.length === 0 ? (
              <p className="text-sm leading-7 text-tera-secondary">
                No recent notes or workflows yet. Save one from your history, profile, or note editor.
              </p>
            ) : (
              recentItems.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={item.href}
                className="block rounded-[18px] border border-tera-border bg-tera-muted px-4 py-4 transition hover:-translate-y-px hover:bg-tera-highlight"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.28em] text-tera-secondary">
                      {item.kind === 'note' ? 'Note' : 'Workflow'}
                    </p>
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-tera-primary">{item.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{item.excerpt}</p>
                </Link>
              ))
            )}
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
