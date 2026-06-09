'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchUserMemories, fetchUserSessions, type UserMemory } from '@/app/actions/user'
import { fetchNotes as fetchWorkspaceNotes, type Note } from '@/app/actions/notes'
import { loadSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'

type QueueItem =
  | {
      id: string
      kind: 'chat'
      title: string
      excerpt: string
      href: string
      timestamp: string
    }
  | {
      id: string
      kind: 'note'
      title: string
      excerpt: string
      href: string
      timestamp: string
    }
  | {
      id: string
      kind: 'memory'
      title: string
      excerpt: string
      href: string
      timestamp: string
    }
  | {
      id: string
      kind: 'workflow'
      title: string
      excerpt: string
      href: string
      timestamp: string
    }

const labels: Record<QueueItem['kind'], string> = {
  chat: 'Chat',
  note: 'Note',
  memory: 'Memory',
  workflow: 'Workflow',
}

export default function ContinueLaterQueue() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<QueueItem[]>([])

  useEffect(() => {
    let cancelled = false

    const loadQueue = async () => {
      setLoading(true)

      try {
        const [sessions, notes, memories] = user
          ? await Promise.all([
              fetchUserSessions(user.id, 5),
              fetchWorkspaceNotes(user.id),
              fetchUserMemories(user.id),
            ])
          : [[], [], []]

        const workflows = loadSavedWorkflows()

        const nextItems: QueueItem[] = [
          ...(sessions as Array<{ session_id: string; title?: string | null; prompt?: string | null; tool?: string | null; created_at: string }>).map((session) => ({
            id: session.session_id,
            kind: 'chat' as const,
            title: session.title || 'Untitled session',
            excerpt: session.prompt || 'Continue this conversation.',
            href: `/new/${session.session_id}`,
            timestamp: session.created_at,
          })),
          ...(notes as Note[]).slice(0, 5).map((note) => ({
            id: note.id,
            kind: 'note' as const,
            title: 'Note',
            excerpt: note.content,
            href: '/notes',
            timestamp: note.updated_at,
          })),
          ...(memories as UserMemory[]).slice(0, 5).map((memory) => ({
            id: memory.id,
            kind: 'memory' as const,
            title: 'Project memory',
            excerpt: memory.memory_text,
            href: '/profile#project-memory',
            timestamp: memory.created_at,
          })),
          ...workflows.slice(0, 5).map((workflow) => ({
            id: workflow.id,
            kind: 'workflow' as const,
            title: workflow.name,
            excerpt: workflow.prompt,
            href: `/new?prompt=${encodeURIComponent(workflow.prompt)}`,
            timestamp: workflow.createdAt,
          })),
        ]

        if (!cancelled) {
          setItems(
            nextItems.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()).slice(0, 8),
          )
        }
      } catch (error) {
        console.error('Failed to load continue-later queue:', error)
        if (!cancelled) {
          setItems(loadSavedWorkflows().slice(0, 5).map((workflow) => ({
            id: workflow.id,
            kind: 'workflow' as const,
            title: workflow.name,
            excerpt: workflow.prompt,
            href: `/new?prompt=${encodeURIComponent(workflow.prompt)}`,
            timestamp: workflow.createdAt,
          })))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadQueue()

    return () => {
      cancelled = true
    }
  }, [user])

  const groupedCount = useMemo(() => {
    const counts: Record<QueueItem['kind'], number> = { chat: 0, note: 0, memory: 0, workflow: 0 }
    for (const item of items) counts[item.kind] += 1
    return counts
  }, [items])

  return (
    <section className="tera-surface mt-8 p-6 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="tera-eyebrow">Continue later</p>
          <h2 className="mt-3 text-2xl font-semibold text-tera-primary">One queue for unfinished work</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-tera-secondary">
            Pull recent chats, notes, memories, and workflows into one place so the next action is obvious.
          </p>
        </div>
        <Link href="/search" className="tera-button-secondary self-start">
          Search everything
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
        <span>Chats {groupedCount.chat}</span>
        <span>Notes {groupedCount.note}</span>
        <span>Memories {groupedCount.memory}</span>
        <span>Workflows {groupedCount.workflow}</span>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-tera-secondary">Loading queue...</p>
        ) : items.length === 0 ? (
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-tera-secondary">
            Nothing queued yet. Start a session, save a note, or pin a workflow to begin.
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={item.href}
              className="block rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:-translate-y-px hover:border-white/16 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">{labels[item.kind]}</p>
                  <p className="mt-2 truncate text-sm font-medium text-tera-primary">{item.title}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{item.excerpt}</p>
                </div>
                <p className="shrink-0 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
                  {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
