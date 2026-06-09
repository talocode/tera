'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchUserMemories, fetchUserSessions, type UserMemory } from '@/app/actions/user'
import { fetchNotes as fetchWorkspaceNotes, type Note } from '@/app/actions/notes'
import { getSearchHistory, saveSearchQuery, type SearchHistoryEntry } from '@/app/actions/search'
import { loadSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'
import { loadContinueLaterQueue, pinContinueLaterItem, setContinueLaterReminder, unpinContinueLaterItem, type ContinueLaterSourceItem } from '@/lib/continue-later'

type SearchTab = 'all' | 'chats' | 'notes' | 'memories' | 'workflows'

type WorkspaceResult =
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

const normalize = (value: string) => value.trim().toLowerCase()

const matches = (haystack: string, needle: string) => !needle || normalize(haystack).includes(needle)

const kindLabels: Record<WorkspaceResult['kind'], string> = {
  chat: 'Chat',
  note: 'Note',
  memory: 'Memory',
  workflow: 'Workflow',
}

const tabToKind: Record<Exclude<SearchTab, 'all'>, WorkspaceResult['kind']> = {
  chats: 'chat',
  notes: 'note',
  memories: 'memory',
  workflows: 'workflow',
}

const RECENT_WORKSPACE_SEARCHES_KEY = 'tera_workspace_search_history'
const MAX_RECENT_WORKSPACE_SEARCHES = 8
const suggestedSearches = ['research', 'notes', 'workflow', 'memory', 'chat', 'study', 'continue later']

function loadRecentWorkspaceSearches(): string[] {
  if (typeof window === 'undefined') return []

  const stored = window.localStorage.getItem(RECENT_WORKSPACE_SEARCHES_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as string[]
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch (error) {
    console.error('Failed to load recent workspace searches:', error)
    return []
  }
}

function persistRecentWorkspaceSearches(queries: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(RECENT_WORKSPACE_SEARCHES_KEY, JSON.stringify(queries))
}

export default function WorkspaceSearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [loading, setLoading] = useState(true)
  const [chats, setChats] = useState<any[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])
  const [pinnedMap, setPinnedMap] = useState<Record<string, true>>({})
  const [recentQueries, setRecentQueries] = useState<string[]>([])
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([])
  const lastSavedQueryRef = useRef<{ query: string; count: number } | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      if (!user) {
        setChats([])
        setNotes([])
        setMemories([])
        setWorkflows(loadSavedWorkflows())
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [chatSessions, noteRows, memoryRows] = await Promise.all([
          fetchUserSessions(user.id, 100),
          fetchWorkspaceNotes(user.id),
          fetchUserMemories(user.id),
        ])

        if (cancelled) return

        setChats(chatSessions)
        setNotes(noteRows)
        setMemories(memoryRows)
        setWorkflows(loadSavedWorkflows())
        setSearchHistory([])
      } catch (error) {
        console.error('Failed to load workspace search data:', error)
        if (!cancelled) {
          setChats([])
          setNotes([])
          setMemories([])
          setWorkflows(loadSavedWorkflows())
          setSearchHistory([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    let cancelled = false

    const loadSearchHistory = async () => {
      if (!user?.id) {
        setSearchHistory([])
        return
      }

      try {
        const entries = await getSearchHistory(user.id, MAX_RECENT_WORKSPACE_SEARCHES)
        if (!cancelled) {
          setSearchHistory(entries)
        }
      } catch (error) {
        console.error('Failed to load search history:', error)
        if (!cancelled) {
          setSearchHistory([])
        }
      }
    }

    void loadSearchHistory()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    const queue = loadContinueLaterQueue()
    setPinnedMap(Object.fromEntries(queue.map((item) => [`${item.kind}:${item.id}`, true])) as Record<string, true>)
  }, [])

  useEffect(() => {
    setRecentQueries(loadRecentWorkspaceSearches())
  }, [])

  const results = useMemo<WorkspaceResult[]>(() => {
    const needle = normalize(query)

    const chatResults = chats
      .filter((session) => {
        if (!needle) return true
        return matches(session.title || '', needle) || matches(session.prompt || '', needle) || matches(session.tool || '', needle)
      })
      .map((session) => ({
        id: session.session_id,
        kind: 'chat' as const,
        title: session.title || 'Untitled chat',
        excerpt: session.prompt || '',
        href: `/new/${session.session_id}`,
        timestamp: session.created_at,
      }))

    const noteResults = notes
      .filter((note) => matches(note.content, needle))
      .map((note) => ({
        id: note.id,
        kind: 'note' as const,
        title: 'Note',
        excerpt: note.content,
        href: '/notes',
        timestamp: note.updated_at,
      }))

    const memoryResults = memories
      .filter((memory) => matches(memory.memory_text, needle))
      .map((memory) => ({
        id: memory.id,
        kind: 'memory' as const,
        title: 'Project memory',
        excerpt: memory.memory_text,
        href: '/profile#project-memory',
        timestamp: memory.created_at,
      }))

    const workflowResults = workflows
      .filter((workflow) => {
        if (!needle) return true
        return matches(workflow.name, needle) || matches(workflow.prompt, needle)
      })
      .map((workflow) => ({
        id: workflow.id,
        kind: 'workflow' as const,
        title: workflow.name,
        excerpt: workflow.prompt,
        href: `/new?prompt=${encodeURIComponent(workflow.prompt)}`,
        timestamp: workflow.createdAt,
      }))

    const all = [...chatResults, ...noteResults, ...memoryResults, ...workflowResults]

    if (activeTab === 'all') return all
    return all.filter((result) => result.kind === tabToKind[activeTab as Exclude<SearchTab, 'all'>])
  }, [activeTab, chats, memories, notes, query, workflows])

  const counts = useMemo(() => {
    const needle = normalize(query)
    return {
      chats: chats.filter((session) => !needle || matches(session.title || '', needle) || matches(session.prompt || '', needle) || matches(session.tool || '', needle)).length,
      notes: notes.filter((note) => !needle || matches(note.content, needle)).length,
      memories: memories.filter((memory) => !needle || matches(memory.memory_text, needle)).length,
      workflows: workflows.filter((workflow) => !needle || matches(workflow.name, needle) || matches(workflow.prompt, needle)).length,
    }
  }, [chats, memories, notes, query, workflows])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) return

    const timeout = window.setTimeout(() => {
      setRecentQueries((current) => {
        const next = [trimmed, ...current.filter((item) => item !== trimmed)].slice(0, MAX_RECENT_WORKSPACE_SEARCHES)
        persistRecentWorkspaceSearches(next)
        return next
      })

      if (user?.id) {
        const nextCount = results.length
        const previous = lastSavedQueryRef.current
        if (previous?.query !== trimmed || previous?.count !== nextCount) {
          void saveSearchQuery(user.id, trimmed, nextCount, activeTab === 'all' ? undefined : { type: activeTab }).then((saved) => {
            if (saved) {
              setSearchHistory((current) => {
                const next = [
                  {
                    id: `${Date.now()}-${trimmed}`,
                    query: trimmed,
                    resultCount: nextCount,
                    filters: activeTab === 'all' ? undefined : { type: activeTab },
                    createdAt: new Date().toISOString(),
                  },
                  ...current.filter((entry) => entry.query !== trimmed),
                ].slice(0, MAX_RECENT_WORKSPACE_SEARCHES)
                return next
              })
            }
          })
          lastSavedQueryRef.current = { query: trimmed, count: nextCount }
        }
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [activeTab, query, results.length, user?.id])

  const togglePin = (item: ContinueLaterSourceItem) => {
    const key = `${item.kind}:${item.id}`
    if (pinnedMap[key]) {
      const next = unpinContinueLaterItem(item.kind, item.id)
      setPinnedMap(Object.fromEntries(next.map((entry) => [`${entry.kind}:${entry.id}`, true])) as Record<string, true>)
      return
    }

    const next = pinContinueLaterItem(item)
    setPinnedMap(Object.fromEntries(next.map((entry) => [`${entry.kind}:${entry.id}`, true])) as Record<string, true>)
  }

  const addReminder = (item: ContinueLaterSourceItem, days: number) => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)
    dueDate.setHours(9, 0, 0, 0)
    setContinueLaterReminder(item, dueDate.toISOString())
  }

  const visibleRecentQueries = user?.id
    ? searchHistory.map((entry) => entry.query)
    : recentQueries

  const applySearch = (value: string) => {
    setQuery(value)
    setActiveTab('all')
  }

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Workspace search</h1>
            <p className="tera-subtitle mt-4">
              Search across chats, notes, memories, and reusable workflows from one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/history" className="tera-button-secondary">
              Chat history
            </Link>
            <Link href="/notes" className="tera-button-secondary">
              Notes
            </Link>
          </div>
        </div>

        <div className="tera-surface mt-8 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full max-w-2xl">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="tera-input w-full"
                placeholder="Search chats, notes, memories, workflows"
              />
            </div>
            <p className="text-sm text-tera-secondary">
              {results.length.toLocaleString()} match{results.length === 1 ? '' : 'es'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {visibleRecentQueries.length > 0 && (
              <>
                <span className="self-center text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">Recent</span>
                {visibleRecentQueries.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => applySearch(item)}
                    className="tera-badge text-[0.62rem] uppercase tracking-[0.2em] transition hover:border-tera-primary hover:text-tera-primary"
                  >
                    {item}
                  </button>
                ))}
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="self-center text-[0.62rem] uppercase tracking-[0.24em] text-tera-secondary">Try</span>
            {suggestedSearches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => applySearch(item)}
                className="tera-badge text-[0.62rem] uppercase tracking-[0.2em] transition hover:border-tera-primary hover:text-tera-primary"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(['all', 'chats', 'notes', 'memories', 'workflows'] as SearchTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[
                  'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition',
                  activeTab === tab
                    ? 'border-tera-primary bg-tera-primary text-tera-bg'
                    : 'border-tera-border bg-tera-muted text-tera-secondary hover:border-tera-primary hover:text-tera-primary',
                ].join(' ')}
              >
                {tab}
                <span className="ml-2 opacity-70">
                  {tab === 'all'
                    ? chats.length + notes.length + memories.length + workflows.length
                    : counts[tab as Exclude<SearchTab, 'all'>]}
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="mt-8 text-sm text-tera-secondary">Loading workspace content...</div>
          ) : results.length === 0 ? (
            <div className="tera-surface-muted mt-8 px-5 py-6 text-sm text-tera-secondary">
              <p>No matching content yet.</p>
              <p className="mt-2 leading-7">
                Try a broader search, switch tabs, or jump back to a recent query above.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/new" className="tera-button-secondary">
                  Start a new chat
                </Link>
                <Link href="/queue" className="tera-button-secondary">
                  Continue later
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {results.map((result) => (
                <article key={`${result.kind}-${result.id}`} className="tera-card-subtle group p-5 transition-all duration-200 hover:-translate-y-px hover:bg-white/[0.06]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[0.62rem] uppercase tracking-[0.3em] text-tera-secondary">{kindLabels[result.kind]}</p>
                      <h2 className="mt-2 truncate text-base font-medium text-tera-primary">{result.title}</h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-tera-secondary">{result.excerpt}</p>
                    </div>
                    <p className="shrink-0 text-[0.62rem] uppercase tracking-[0.22em] text-tera-secondary">
                      {new Date(result.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 transition-all duration-200 group-hover:translate-y-[-1px]">
                    <Link href={result.href} className="tera-button-secondary">
                      Open
                    </Link>
                    <button
                      type="button"
                      onClick={() => togglePin({
                        id: result.id,
                        kind: result.kind,
                        title: result.title,
                        excerpt: result.excerpt,
                        href: result.href,
                        timestamp: result.timestamp,
                      })}
                      className="tera-button-secondary"
                    >
                      {pinnedMap[`${result.kind}:${result.id}`] ? 'Pinned' : 'Pin for later'}
                    </button>
                    <button
                      type="button"
                      onClick={() => addReminder({
                        id: result.id,
                        kind: result.kind,
                        title: result.title,
                        excerpt: result.excerpt,
                        href: result.href,
                        timestamp: result.timestamp,
                      }, 1)}
                      className="tera-button-secondary"
                    >
                      Remind tomorrow
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
