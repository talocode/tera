'use server'

import { supabaseServer } from '@/lib/supabase-server'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface SearchHistoryEntry {
    id: string
    query: string
    resultCount: number
    filters?: {
        type?: string
        dateRange?: string
    }
    createdAt: string
}

export interface SearchBookmark {
    id: string
    title: string
    url: string
    snippet: string
    source: string
    notes?: string
    tags?: string[]
    createdAt: string
}

// Save a search query to history
export async function saveSearchQuery(
    userId: string,
    query: string,
    resultCount: number,
    filters?: { type?: string; dateRange?: string }
) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        const { error } = await supabaseServer
            .from('search_history')
            .insert({
                user_id: userId,
                query: query,
                result_count: resultCount,
                filters: filters || null
            })

        if (error) {
            console.error('Failed to save search history:', error)
            return false
        }
        return true
    } catch (error) {
        console.error('Error saving search history:', error)
        return false
    }
}

// Get user's search history
export async function getSearchHistory(userId: string, limit: number = 20) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return []

        const { data, error } = await supabaseServer
            .from('search_history')
            .select('id, query, result_count, filters, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Failed to get search history:', error)
            return []
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            query: row.query,
            resultCount: row.result_count,
            filters: row.filters,
            createdAt: row.created_at
        }))
    } catch (error) {
        console.error('Error getting search history:', error)
        return []
    }
}

// Clear user's search history
export async function clearSearchHistory(userId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        const { error } = await supabaseServer
            .from('search_history')
            .delete()
            .eq('user_id', userId)

        if (error) {
            console.error('Failed to clear search history:', error)
            return false
        }
        return true
    } catch (error) {
        console.error('Error clearing search history:', error)
        return false
    }
}

// Clear user's bookmarks
export async function clearBookmarks(userId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        const { error } = await supabaseServer
            .from('search_bookmarks')
            .delete()
            .eq('user_id', userId)

        if (error) {
            console.error('Failed to clear bookmarks:', error)
            return false
        }
        return true
    } catch (error) {
        console.error('Error clearing bookmarks:', error)
        return false
    }
}

// Save a bookmark
export async function saveBookmark(
    userId: string,
    source: { title: string; url: string; snippet: string; source: string },
    notes?: string,
    tags?: string[]
) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        // Check if already bookmarked
        const { data: existing } = await supabaseServer
            .from('search_bookmarks')
            .select('id')
            .eq('user_id', userId)
            .eq('url', source.url)
            .limit(1)

        if (existing && existing.length > 0) {
            // Update existing bookmark
            const { error } = await supabaseServer
                .from('search_bookmarks')
                .update({
                    title: source.title,
                    snippet: source.snippet,
                    source: source.source,
                    notes: notes || null,
                    tags: tags || null
                })
                .eq('id', existing[0].id)

            if (error) return false
        } else {
            // Create new bookmark
            const { error } = await supabaseServer
                .from('search_bookmarks')
                .insert({
                    user_id: userId,
                    title: source.title,
                    url: source.url,
                    snippet: source.snippet,
                    source: source.source,
                    notes: notes || null,
                    tags: tags || null
                })

            if (error) return false
        }
        return true
    } catch (error) {
        console.error('Error saving bookmark:', error)
        return false
    }
}

// Get user's bookmarks
export async function getBookmarks(userId: string, limit: number = 50) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return []

        const { data, error } = await supabaseServer
            .from('search_bookmarks')
            .select('id, title, url, snippet, source, notes, tags, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) return []

        return (data || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            url: row.url,
            snippet: row.snippet,
            source: row.source,
            notes: row.notes,
            tags: row.tags,
            createdAt: row.created_at
        }))
    } catch (error) {
        console.error('Error getting bookmarks:', error)
        return []
    }
}

// Delete a bookmark
export async function deleteBookmark(userId: string, bookmarkId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        const { error } = await supabaseServer
            .from('search_bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('id', bookmarkId)

        if (error) return false
        return true
    } catch (error) {
        console.error('Error deleting bookmark:', error)
        return false
    }
}

// Check if a URL is bookmarked
export async function isBookmarked(userId: string, url: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        const { data, error } = await supabaseServer
            .from('search_bookmarks')
            .select('id')
            .eq('user_id', userId)
            .eq('url', url)
            .limit(1)

        if (error) return false
        return (data?.length || 0) > 0
    } catch (error) {
        return false
    }
}
