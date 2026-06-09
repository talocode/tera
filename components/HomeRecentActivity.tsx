'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchUserSessions } from '@/app/actions/user'
import { loadSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'

type RecentSession = {
  session_id: string
  title?: string | null
  prompt?: string | null
  tool?: string | null
  created_at: string
}

export default function HomeRecentActivity() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<RecentSession[]>([])
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadActivity = async () => {
      if (!user) {
        setSessions([])
        setWorkflows(loadSavedWorkflows().slice(0, 4))
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [recentSessions] = await Promise.all([
          fetchUserSessions(user.id, 4),
        ])

        if (cancelled) return

        setSessions(recentSessions)
        setWorkflows(loadSavedWorkflows().slice(0, 4))
      } catch (error) {
        console.error('Failed to load recent activity:', error)
        if (!cancelled) {
          setSessions([])
          setWorkflows(loadSavedWorkflows().slice(0, 4))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadActivity()

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="tera-surface p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tera-eyebrow">Return path</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Continue where you left off</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
              Reopen recent conversations without hunting through history.
            </p>
          </div>
          <Link href="/search" className="tera-button-secondary self-start">
            Search workspace
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-tera-secondary">Loading recent work...</p>
          ) : sessions.length === 0 ? (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-tera-secondary">
              No recent sessions yet. Start a chat to create your first workspace thread.
            </div>
          ) : (
            sessions.map((session) => (
              <Link
                key={session.session_id}
                href={`/new/${session.session_id}`}
                className="block rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:-translate-y-px hover:border-white/16 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-tera-primary">{session.title || 'Untitled session'}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">
                      {session.prompt || 'Open this session to continue the conversation.'}
                    </p>
                  </div>
                  <p className="shrink-0 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
                    {session.tool || 'Chat'}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="tera-surface p-6 md:p-8">
        <div>
          <p className="tera-eyebrow">Reused work</p>
          <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Saved workflows</h2>
          <p className="mt-3 text-sm leading-7 text-tera-secondary">
            One-click prompts keep repeat tasks out of your head.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {workflows.length === 0 ? (
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-tera-secondary">
              Save a prompt from history, then bring it back here whenever you need it again.
            </div>
          ) : (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:border-white/16 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-medium text-tera-primary">{workflow.name}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{workflow.prompt}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/new?prompt=${encodeURIComponent(workflow.prompt)}`} className="tera-button-primary">
                    Launch in chat
                  </Link>
                  <Link href="/profile#saved-workflows" className="tera-button-secondary">
                    Edit workflows
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
