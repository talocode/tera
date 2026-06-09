'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchUserMemories, fetchUserSessions, type UserMemory } from '@/app/actions/user'
import { fetchNotes as fetchWorkspaceNotes, type Note } from '@/app/actions/notes'
import { loadSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'
import {
  archiveContinueLaterItem,
  loadContinueLaterArchive,
  loadContinueLaterQueue,
  pinContinueLaterItem,
  setContinueLaterReminder,
  unarchiveContinueLaterItem,
  unpinContinueLaterItem,
  type ContinueLaterItem,
  type ContinueLaterSourceItem,
} from '@/lib/continue-later'

type QueueItem = ContinueLaterItem

const labels: Record<QueueItem['kind'], string> = {
  chat: 'Chat',
  note: 'Note',
  memory: 'Memory',
  workflow: 'Workflow',
}

function toPinnedKey(item: ContinueLaterSourceItem) {
  return `${item.kind}:${item.id}`
}

function scheduleTomorrow(item: ContinueLaterSourceItem) {
  const remindAt = new Date()
  remindAt.setDate(remindAt.getDate() + 1)
  remindAt.setHours(9, 0, 0, 0)
  setContinueLaterReminder(item, remindAt.toISOString())
}

export default function ContinueLaterQueue() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<QueueItem[]>([])
  const [archivedItems, setArchivedItems] = useState<QueueItem[]>([])
  const [pinnedKeys, setPinnedKeys] = useState<Record<string, true>>({})
  const [refreshToken, setRefreshToken] = useState(0)

  const handlePin = useCallback((item: ContinueLaterSourceItem) => {
    const next = pinContinueLaterItem(item)
    setPinnedKeys(Object.fromEntries(next.map((entry) => [toPinnedKey(entry), true])) as Record<string, true>)
    setRefreshToken((current) => current + 1)
  }, [])

  const handleUnpin = useCallback((kind: ContinueLaterItem['kind'], id: string) => {
    const next = unpinContinueLaterItem(kind, id)
    setPinnedKeys(Object.fromEntries(next.map((entry) => [toPinnedKey(entry), true])) as Record<string, true>)
    setRefreshToken((current) => current + 1)
  }, [])

  const handleDone = useCallback((item: ContinueLaterSourceItem) => {
    archiveContinueLaterItem(item)
    setRefreshToken((current) => current + 1)
  }, [])

  const handleUndoDone = useCallback((item: QueueItem) => {
    unarchiveContinueLaterItem(item.kind, item.id)
    pinContinueLaterItem(item)
    setRefreshToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadQueue = async () => {
      setLoading(true)

      try {
        const pinned = loadContinueLaterQueue()
        const pinnedLookup = Object.fromEntries(pinned.map((item) => [toPinnedKey(item), true])) as Record<string, true>
        setPinnedKeys(pinnedLookup)
        setArchivedItems(loadContinueLaterArchive().slice(0, 5))

        const [sessions, notes, memories] = user
          ? await Promise.all([
              fetchUserSessions(user.id, 5),
              fetchWorkspaceNotes(user.id),
              fetchUserMemories(user.id),
            ])
          : [[], [], []]

        const workflows = loadSavedWorkflows()

        const sourceItems: ContinueLaterSourceItem[] = [
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

        const merged = new Map<string, QueueItem>()
        for (const item of sourceItems) {
          const key = toPinnedKey(item)
          merged.set(key, { ...item, pinnedAt: item.timestamp })
        }
        for (const item of pinned) {
          merged.set(toPinnedKey(item), item)
        }

        const nextItems = Array.from(merged.values()).sort((left, right) => {
          const leftPinned = pinnedLookup[toPinnedKey(left)] ? 1 : 0
          const rightPinned = pinnedLookup[toPinnedKey(right)] ? 1 : 0

          if (leftPinned !== rightPinned) return rightPinned - leftPinned
          return new Date(right.pinnedAt || right.timestamp).getTime() - new Date(left.pinnedAt || left.timestamp).getTime()
        })

        if (!cancelled) {
          setItems(nextItems.slice(0, 8))
          setArchivedItems(loadContinueLaterArchive().slice(0, 5))
        }
      } catch (error) {
        console.error('Failed to load continue-later queue:', error)
        if (!cancelled) {
          const fallback = loadSavedWorkflows().slice(0, 5).map((workflow) => ({
            id: workflow.id,
            kind: 'workflow' as const,
            title: workflow.name,
            excerpt: workflow.prompt,
            href: `/new?prompt=${encodeURIComponent(workflow.prompt)}`,
            timestamp: workflow.createdAt,
            pinnedAt: workflow.createdAt,
          }))
          setItems(fallback)
          setArchivedItems(loadContinueLaterArchive().slice(0, 5))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadQueue()

    return () => {
      cancelled = true
    }
  }, [refreshToken, user])

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
            Pin the work you want to return to, and Tera keeps it ready across your workspace.
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
          items.map((item) => {
            const isPinned = !!pinnedKeys[toPinnedKey(item)]

            return (
              <div
                key={`${item.kind}-${item.id}`}
                className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 transition hover:-translate-y-px hover:border-white/16 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link href={item.href} className="min-w-0 flex-1">
                    <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">{labels[item.kind]}</p>
                    <p className="mt-2 truncate text-sm font-medium text-tera-primary">{item.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-tera-secondary">{item.excerpt}</p>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => scheduleTomorrow(item)}
                        className="tera-button-secondary px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em]"
                      >
                        Remind tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => (isPinned ? handleUnpin(item.kind, item.id) : handlePin(item))}
                        className="tera-button-secondary px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em]"
                      >
                        {isPinned ? 'Pinned' : 'Pin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDone(item)}
                        className="tera-button-secondary px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em]"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {archivedItems.length > 0 && (
        <div className="mt-8 rounded-[22px] border border-white/8 bg-black/10 px-5 py-4">
          <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">Completed</p>
          <div className="mt-4 space-y-3">
            {archivedItems.map((item) => (
              <div
                key={`archived-${item.kind}-${item.id}`}
                className="flex flex-col gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-tera-primary">{item.title}</p>
                  <p className="mt-1 text-sm text-tera-secondary">
                    Completed {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUndoDone(item)}
                  className="tera-button-secondary self-start px-3 py-1 text-[0.58rem] uppercase tracking-[0.22em]"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
