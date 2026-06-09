'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
    clearBookmarks,
    clearSearchHistory,
    deleteBookmark,
    getBookmarks,
    getSearchHistory,
    saveBookmark,
    type SearchBookmark,
    type SearchHistoryEntry,
} from '@/app/actions/search'

interface SearchHistoryProps {
    userId: string
    onSelectQuery: (query: string) => void
    onSelectBookmark: (url: string) => void
    initialTab?: 'history' | 'bookmarks'
    showHistoryTab?: boolean
    className?: string
    contentClassName?: string
}

export default function SearchHistory({
    userId,
    onSelectQuery,
    onSelectBookmark,
    initialTab = 'history',
    showHistoryTab = true,
    className,
    contentClassName,
}: SearchHistoryProps) {
    const [activeTab, setActiveTab] = useState<'history' | 'bookmarks'>(initialTab)
    const [bookmarkFilter, setBookmarkFilter] = useState('')
    const [history, setHistory] = useState<SearchHistoryEntry[]>([])
    const [bookmarks, setBookmarks] = useState<SearchBookmark[]>([])
    const [bookmarkNotes, setBookmarkNotes] = useState<Record<string, string>>({})
    const [bookmarkTags, setBookmarkTags] = useState<Record<string, string>>({})
    const [savingBookmarkIds, setSavingBookmarkIds] = useState<Record<string, boolean>>({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!showHistoryTab && activeTab === 'history') {
            setActiveTab('bookmarks')
        }
    }, [activeTab, showHistoryTab])

    useEffect(() => {
        loadData()
    }, [userId, activeTab])

    const loadData = async () => {
        setIsLoading(true)
        try {
            if (activeTab === 'history') {
                const data = await getSearchHistory(userId)
                setHistory(data)
            } else {
                const data = await getBookmarks(userId)
                setBookmarks(data)
                setBookmarkNotes(Object.fromEntries(data.map((bookmark) => [bookmark.id, bookmark.notes || ''])))
                setBookmarkTags(Object.fromEntries(data.map((bookmark) => [bookmark.id, (bookmark.tags || []).join(', ')])))
            }
        } catch (error) {
            console.error('Failed to load search data', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear your entire search history?')) {
            await clearSearchHistory(userId)
            setHistory([])
        }
    }

    const handleClearBookmarks = async () => {
        if (confirm('Are you sure you want to clear all saved bookmarks?')) {
            await clearBookmarks(userId)
            setBookmarks([])
            setBookmarkNotes({})
            setBookmarkTags({})
        }
    }

    const handleExportBookmarks = () => {
        const payload = bookmarks.map((bookmark) => ({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            snippet: bookmark.snippet,
            source: bookmark.source,
            notes: bookmark.notes || '',
            tags: bookmark.tags || [],
            createdAt: bookmark.createdAt,
        }))

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `tera-bookmarks-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        URL.revokeObjectURL(url)
    }

    const handleDeleteBookmark = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        await deleteBookmark(userId, id)
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
        setBookmarkNotes((current) => {
            const next = { ...current }
            delete next[id]
            return next
        })
        setBookmarkTags((current) => {
            const next = { ...current }
            delete next[id]
            return next
        })
    }

    const handleSaveBookmarkDetails = async (bookmark: SearchBookmark) => {
        setSavingBookmarkIds((current) => ({ ...current, [bookmark.id]: true }))

        try {
            const notes = bookmarkNotes[bookmark.id] || undefined
            const tags = bookmarkTags[bookmark.id]
                ?.split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)

            const saved = await saveBookmark(
                userId,
                {
                    title: bookmark.title,
                    url: bookmark.url,
                    snippet: bookmark.snippet,
                    source: bookmark.source,
                },
                notes,
                tags && tags.length > 0 ? tags : undefined
            )

            if (saved) {
                setBookmarks((current) =>
                    current.map((item) =>
                        item.id === bookmark.id
                            ? {
                                ...item,
                                notes,
                                tags,
                            }
                            : item
                    )
                )
            }
        } catch (error) {
            console.error('Failed to save bookmark details', error)
        } finally {
            setSavingBookmarkIds((current) => ({ ...current, [bookmark.id]: false }))
        }
    }

    const filteredBookmarks = useMemo(() => {
        const needle = bookmarkFilter.trim().toLowerCase()
        if (!needle) return bookmarks

        return bookmarks.filter((bookmark) => {
            const searchable = [
                bookmark.title,
                bookmark.url,
                bookmark.snippet,
                bookmark.source,
                bookmark.notes || '',
                ...(bookmark.tags || []),
            ]
                .join(' ')
                .toLowerCase()

            return searchable.includes(needle)
        })
    }, [bookmarkFilter, bookmarks])

    const contentClasses = ['overflow-y-auto p-2', !contentClassName ? 'max-h-[400px]' : null, contentClassName]
        .filter(Boolean)
        .join(' ')

    return (
        <div className={['tera-surface w-full overflow-hidden', className].filter(Boolean).join(' ')}>
            <div className="flex border-b border-tera-border">
                {showHistoryTab && (
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history'
                            ? 'bg-tera-muted text-tera-primary border-b-2 border-tera-neon'
                            : 'text-tera-secondary hover:text-tera-primary hover:bg-tera-muted/50'
                            }`}
                    >
                        🕒 History
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('bookmarks')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'bookmarks'
                        ? 'bg-tera-muted text-tera-primary border-b-2 border-tera-neon'
                        : 'text-tera-secondary hover:text-tera-primary hover:bg-tera-muted/50'
                        }`}
                >
                    🔖 Bookmarks
                </button>
            </div>

            <div className={contentClasses}>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="w-6 h-6 border-2 border-tera-neon border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activeTab === 'history' ? (
                    <div className="space-y-1">
                        {history.length === 0 ? (
                            <div className="text-center p-8 text-tera-secondary text-sm">
                                No search history yet
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-end px-2 py-1">
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Clear History
                                    </button>
                                </div>
                                {history.map((entry) => (
                                <button
                                        key={entry.id}
                                        onClick={() => onSelectQuery(entry.query)}
                                        className="group flex w-full items-center justify-between rounded-[18px] px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-tera-primary truncate">{entry.query}</p>
                                            <p className="text-xs text-tera-secondary">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="text-xs text-tera-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                                            ↗
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="px-1 pb-1">
                            <input
                                value={bookmarkFilter}
                                onChange={(event) => setBookmarkFilter(event.target.value)}
                                placeholder="Filter bookmarks by title, notes, tags, or URL"
                                className="w-full rounded-lg border border-tera-border bg-tera-bg/60 px-3 py-2 text-xs text-tera-primary placeholder:text-tera-secondary/60"
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleExportBookmarks}
                                    className="rounded-full border border-tera-border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-tera-secondary transition hover:border-tera-primary hover:text-tera-primary"
                                    disabled={bookmarks.length === 0}
                                >
                                    Export JSON
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearBookmarks}
                                    className="rounded-full border border-red-500/20 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-red-300 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={bookmarks.length === 0}
                                >
                                    Clear bookmarks
                                </button>
                            </div>
                        </div>
                        {bookmarks.length === 0 ? (
                            <div className="text-center p-8 text-tera-secondary text-sm">
                                No bookmarks saved yet
                            </div>
                        ) : filteredBookmarks.length === 0 ? (
                            <div className="text-center p-8 text-tera-secondary text-sm">
                                No bookmarks match your filter.
                            </div>
                        ) : (
                            filteredBookmarks.map((bookmark) => (
                                <div
                                    key={bookmark.id}
                                    onClick={() => onSelectBookmark(bookmark.url)}
                                    className="group relative w-full cursor-pointer rounded-[20px] border border-tera-border bg-tera-muted p-3 transition-all hover:-translate-y-px hover:bg-tera-highlight"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="line-clamp-1 text-sm font-medium text-tera-primary">
                                                {bookmark.title}
                                            </h4>
                                            <p className="mt-1 line-clamp-2 text-xs text-tera-secondary">
                                                {bookmark.snippet}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="rounded bg-tera-muted px-1.5 py-0.5 text-[10px] text-tera-secondary/80">
                                                    {bookmark.source}
                                                </span>
                                                <span className="text-[10px] text-tera-secondary/60">
                                                    {new Date(bookmark.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <textarea
                                                value={bookmarkNotes[bookmark.id] || ''}
                                                onChange={(event) => setBookmarkNotes((current) => ({ ...current, [bookmark.id]: event.target.value }))}
                                                onClick={(event) => event.stopPropagation()}
                                                placeholder="Add notes about why this source matters..."
                                                className="mt-3 min-h-[72px] w-full rounded-lg border border-tera-border bg-tera-bg/60 px-3 py-2 text-xs text-tera-primary placeholder:text-tera-secondary/60"
                                            />
                                            <input
                                                value={bookmarkTags[bookmark.id] || ''}
                                                onChange={(event) => setBookmarkTags((current) => ({ ...current, [bookmark.id]: event.target.value }))}
                                                onClick={(event) => event.stopPropagation()}
                                                placeholder="Tags, comma separated"
                                                className="mt-2 w-full rounded-lg border border-tera-border bg-tera-bg/60 px-3 py-2 text-xs text-tera-primary placeholder:text-tera-secondary/60"
                                            />
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        void handleSaveBookmarkDetails(bookmark)
                                                    }}
                                                    className="rounded-full bg-tera-primary px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-tera-bg transition hover:opacity-90"
                                                >
                                                    {savingBookmarkIds[bookmark.id] ? 'Saving...' : 'Save details'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation()
                                                        onSelectBookmark(bookmark.url)
                                                    }}
                                                    className="rounded-full border border-tera-border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-tera-secondary transition hover:border-tera-primary hover:text-tera-primary"
                                                >
                                                    Open source
                                                </button>
                                                {bookmark.tags && bookmark.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {bookmark.tags.map((tag) => (
                                                            <span key={tag} className="rounded-full border border-tera-border px-2 py-0.5 text-[10px] text-tera-secondary">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(event) => handleDeleteBookmark(bookmark.id, event)}
                                            className="p-1.5 text-tera-secondary transition-all opacity-0 hover:text-red-400 group-hover:opacity-100"
                                            title="Remove bookmark"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
