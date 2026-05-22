'use server'

import { getUserProfileServer, checkAndResetUsageServer } from '@/lib/usage-tracking-server'
import { buildProfileUsageSummary } from '@/lib/profile-usage'
import { supabaseServer } from '@/lib/supabase-server'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import dns from 'node:dns'
import { getUserCreditsRemaining } from '@/lib/free-plan-credits'
import { getDailyUsageLedgerHistory, getUsageLedgerWindowSummary } from '@/lib/usage-ledger'

// Force IPv4 to avoid SSL/TLS handshake issues with Supabase on some networks
try {
    if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first')
    }
} catch (e) {
    // Ignore if not supported
}

export async function fetchUserProfile(userId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return null

        const profile = await getUserProfileServer(userId)
        return profile
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return null
    }
}

export async function fetchUserUsageSummary(userId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return null

        await checkAndResetUsageServer(userId)

        const profile = await getUserProfileServer(userId)

        if (!profile) return null

        return buildProfileUsageSummary({
            plan: profile.subscriptionPlan,
            dailyChats: profile.dailyChats,
            dailyFileUploads: profile.dailyFileUploads,
            chatResetDate: profile.chatResetDate,
        })
    } catch (error) {
        console.error('Error fetching user usage summary:', error)
        return null
    }
}

export async function updateUserProfile(userId: string, updates: any) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return false

        const dbUpdates: any = {}
        if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
        if (updates.school !== undefined) dbUpdates.school = updates.school
        if (updates.gradeLevels !== undefined) dbUpdates.grade_levels = updates.gradeLevels
        if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl

        const { error } = await supabaseServer
            .from('users')
            .update(dbUpdates)
            .eq('id', userId)

        if (error) throw error
        revalidatePath('/profile')
        return true
    } catch (error) {
        console.error('Error updating profile:', error)
        return false
    }
}

export async function checkLimitReset(userId: string) {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== userId) return null
    return await checkAndResetUsageServer(userId)
}

export async function fetchUserSessions(userId: string, limit: number = 20) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return []

        const { data, error } = await supabaseServer
            .from('chat_sessions')
            .select('session_id, title, created_at, prompt, tool')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        const uniqueSessions = Array.from(new Map(data.map((item: any) => [item.session_id, item])).values())
        return uniqueSessions
    } catch (error) {
        console.error('Error fetching sessions:', error)
        return []
    }
}

export async function fetchCreditUsage(userId: string) {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== userId) return null
    return await getUserCreditsRemaining(userId)
}

export async function fetchDailyTokenUsage(userId: string) {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== userId) return null

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const summary = await getUsageLedgerWindowSummary(userId, startOfDay)
    if (summary) return { usedToday: summary.tokenUsage }

    const { data, error } = await supabaseServer
        .from('chat_sessions')
        .select('token_usage')
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())

    if (error) {
        console.error('Error fetching daily token usage:', error)
        return null
    }

    const usedToday = (data || []).reduce((sum: number, row: any) => sum + Number(row.token_usage || 0), 0)
    return { usedToday }
}

export async function fetchWeeklyUsageHistory(userId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return []

        const ledgerHistory = await getDailyUsageLedgerHistory(userId, 7)
        if (ledgerHistory.some((day) => day.tokens > 0 || day.credits > 0 || day.chats > 0)) {
            return ledgerHistory.map(({ date, tokens }) => ({ date, used: tokens }))
        }

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const { data, error } = await supabaseServer
            .from('chat_sessions')
            .select('created_at, token_usage')
            .eq('user_id', userId)
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: true })

        if (error) throw error

        // Group by day
        const history: Record<string, number> = {}
        for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            history[dateStr] = 0
        }

        data?.forEach((row: any) => {
            const dateStr = row.created_at.split('T')[0]
            if (history[dateStr] !== undefined) {
                history[dateStr] += Number(row.token_usage || 0)
            }
        })

        return Object.entries(history)
            .map(([date, used]) => ({ date, used }))
            .sort((a, b) => a.date.localeCompare(b.date))
    } catch (error) {
        console.error('Error fetching weekly usage history:', error)
        return []
    }
}

export async function fetchChatHistory(userId: string, sessionId: string) {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return []

        const { data, error } = await supabaseServer
            .from('chat_sessions')
            .select('id, prompt, response, attachments, created_at, tool')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })
            .limit(50)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching chat history:', error)
        return []
    }
}

export async function fetchHistoryPageData(userId: string, page: number = 1, pageSize: number = 20, searchQuery: string = '') {
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.id !== userId) return { sessions: [], hasMore: false }

        let query = supabaseServer
            .from('chat_sessions')
            .select('session_id, title, created_at, prompt, tool, id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (searchQuery) {
            query = query.or(`title.ilike.%${searchQuery}%,prompt.ilike.%${searchQuery}%`)
        }

        const fetchSize = pageSize * 10
        const from = (page - 1) * fetchSize
        const to = from + fetchSize - 1

        const { data, error } = await query.range(from, to)

        if (error) throw error

        const uniqueMap = new Map()
        data?.forEach((item: any) => {
            if (!uniqueMap.has(item.session_id)) {
                uniqueMap.set(item.session_id, {
                    id: item.id,
                    session_id: item.session_id,
                    title: item.title,
                    last_message: item.prompt,
                    created_at: item.created_at,
                    tool: item.tool,
                })
            }
        })

        const uniqueSessions = Array.from(uniqueMap.values())

        return {
            sessions: uniqueSessions.slice(0, pageSize),
            hasMore: uniqueSessions.length > pageSize,
        }
    } catch (error) {
        console.error('Error fetching history:', error)
        return { sessions: [], hasMore: false }
    }
}

