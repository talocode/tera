'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { fetchUserMemories, fetchUserSessions, type UserMemory } from '@/app/actions/user'
import { fetchNotes as fetchWorkspaceNotes, type Note } from '@/app/actions/notes'
import { loadSavedWorkflows, type SavedWorkflow } from '@/lib/saved-workflows'

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

export default function WorkspaceSearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [loading, setLoading] = useState(true)
  const [chats, setChats] = useState<any[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [workflows, setWorkflows] = useState<SavedWorkflow[]>([])

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
      } catch (error) {
        console.error('Failed to load workspace search data:', error)
        if (!cancelled) {
          setChats([])
          setNotes([])
          setMemories([])
          setWorkflows(loadSavedWorkflows())
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
                    : 'border-white/10 bg-white/[0.03] text-tera-secondary hover:border-white/18 hover:text-tera-primary',
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
            <div className="mt-8 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-tera-secondary">
              No matching content yet.
            </div>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {results.map((result) => (
                <article key={`${result.kind}-${result.id}`} className="tera-card-subtle p-5 transition-transform duration-200 hover:-translate-y-px hover:bg-white/[0.06]">
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
                  <div className="mt-4">
                    <Link href={result.href} className="tera-button-secondary">
                      Open
                    </Link>
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
