// Usage tracking utilities
// Functions to track and manage user usage across plans

import { supabase } from './supabase'
import type { PlanType } from './plan-config'
import { PLAN_CONFIGS, canStartChat, canUploadFile, getRemainingChats, getRemainingFileUploads } from './plan-config'

export interface UsageStats {
    dailyChats: number
    dailyFileUploads: number
    monthlyWebSearches?: number
    chatResetDate: Date
}

export interface UserProfile {
    id: string
    email: string
    subscriptionPlan: PlanType
    dailyChats: number
    monthlyFileUploads: number
    monthlyWebSearches: number
    chatResetDate: Date | null
    uploadResetDate: Date | null
    webSearchResetDate: Date | null
    limitHitChatAt: Date | null
    limitHitUploadAt: Date | null
    profileImageUrl: string | null
    fullName: string | null
    school: string | null
    gradeLevels: string[] | null
    createdAt: Date
}

/**
 * Fetch user profile with usage stats
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return {
        id: data.id,
        email: data.email,
        subscriptionPlan: (data.subscription_plan || 'free') as PlanType,
        dailyChats: data.daily_chats || 0,
        monthlyFileUploads: data.monthly_file_uploads || 0,
        monthlyWebSearches: data.monthly_web_searches || 0,
        chatResetDate: data.chat_reset_date ? new Date(data.chat_reset_date) : null,
        uploadResetDate: data.upload_reset_date ? new Date(data.upload_reset_date) : null,
        webSearchResetDate: data.web_search_reset_date ? new Date(data.web_search_reset_date) : null,
        limitHitChatAt: data.limit_hit_chat_at ? new Date(data.limit_hit_chat_at) : null,
        limitHitUploadAt: data.limit_hit_upload_at ? new Date(data.limit_hit_upload_at) : null,
        profileImageUrl: data.profile_image_url,
        fullName: data.full_name,
        school: data.school,
        gradeLevels: data.grade_levels,
        createdAt: new Date(data.created_at)
    }
}

/**
 * Get just the usage stats
 */
export async function getUsageStats(userId: string): Promise<UsageStats | null> {
    const { data, error } = await supabase
        .from('users')
        .select('daily_chats, monthly_file_uploads, monthly_web_searches, chat_reset_date')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching usage stats:', error)
        return null
    }

    return {
        dailyChats: data.daily_chats || 0,
        dailyFileUploads: data.monthly_file_uploads || 0,
        monthlyWebSearches: data.monthly_web_searches || 0,
        chatResetDate: data.chat_reset_date ? new Date(data.chat_reset_date) : new Date()
    }
}

/**
 * Check if counters need to be reset
 * Supports both daily reset and 24-hour unlock from when limit was hit
 */
export async function checkAndResetUsage(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('users')
        .select('chat_reset_date, limit_hit_chat_at, limit_hit_upload_at, upload_reset_date')
        .eq('id', userId)
        .single()

    if (error || !data) return false

    const now = new Date()
    const updates: Record<string, any> = {}
    let needsUpdate = false

    // Check 24-hour unlock from when chat limit was hit
    if (data.limit_hit_chat_at) {
        const hitTime = new Date(data.limit_hit_chat_at)
        const unlockTime = new Date(hitTime.getTime() + 24 * 60 * 60 * 1000) // 24 hours later

        if (now >= unlockTime) {
            updates.daily_chats = 0
            updates.limit_hit_chat_at = null
            needsUpdate = true
        }
    }

    // MONTHLY UPLOAD RESET LOGIC
    const uploadResetDate = data.upload_reset_date ? new Date(data.upload_reset_date) : null
    if (!uploadResetDate || now >= uploadResetDate) {
        const nextUploadResetDate = new Date(now)
        nextUploadResetDate.setMonth(nextUploadResetDate.getMonth() + 1)

        updates.monthly_file_uploads = 0
        updates.upload_reset_date = nextUploadResetDate.toISOString()
        updates.limit_hit_upload_at = null
        needsUpdate = true
    } else if (data.limit_hit_upload_at) {
        // Check 24-hour unlock from when upload limit was hit (within the month)
        const hitTime = new Date(data.limit_hit_upload_at)
        const unlockTime = new Date(hitTime.getTime() + 24 * 60 * 60 * 1000)

        if (now >= unlockTime) {
            updates.limit_hit_upload_at = null
            needsUpdate = true
        }
    }

    // DAILY CHAT RESET LOGIC
    const resetDate = data.chat_reset_date ? new Date(data.chat_reset_date) : null

    if (!resetDate || now >= resetDate) {
        const nextChatResetDate = new Date(now)
        nextChatResetDate.setDate(nextChatResetDate.getDate() + 1)

        updates.daily_chats = 0
        updates.chat_reset_date = nextChatResetDate.toISOString()

        // Clear chat locks on daily reset
        updates.limit_hit_chat_at = null

        needsUpdate = true
    }

    if (needsUpdate) {
        const { error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)

        if (updateError) {
            console.error('Error resetting usage:', updateError)
            return false
        }
        return true
    }

    return false
}



/**
 * Check if user can start a new chat
 */
export async function canUserStartChat(userId: string): Promise<{ allowed: boolean; remaining: number | 'unlimited'; reason?: string; unlocksAt?: Date }> {
    const profile = await getUserProfile(userId)
    if (!profile) return { allowed: false, remaining: 0, reason: 'User not found' }

    // Reset if needed
    await checkAndResetUsage(userId)

    // Get fresh stats after potential reset
    const stats = await getUsageStats(userId)
    if (!stats) return { allowed: false, remaining: 0, reason: 'Could not fetch usage stats' }

    return { allowed: true, remaining: 'unlimited' }
}

/**
 * Check if user can upload files
 */
export async function canUserUploadFiles(userId: string, fileCount: number = 1): Promise<{ allowed: boolean; remaining: number | 'unlimited'; reason?: string; unlocksAt?: Date }> {
    const profile = await getUserProfile(userId)
    if (!profile) return { allowed: false, remaining: 0, reason: 'User not found' }

    // Reset if needed
    await checkAndResetUsage(userId)

    // Get fresh stats after potential reset
    const stats = await getUsageStats(userId)
    if (!stats) return { allowed: false, remaining: 0, reason: 'Could not fetch usage stats' }

    const totalAfter = stats.dailyFileUploads + fileCount
    const allowed = canUploadFile(profile.subscriptionPlan, totalAfter - 1) // Check if we can add this many

    const remaining = getRemainingFileUploads(profile.subscriptionPlan, stats.dailyFileUploads)

    if (!allowed) {
        const limit = PLAN_CONFIGS[profile.subscriptionPlan].limits.fileUploadsPerMonth
        const remainingStr = remaining === 'unlimited' ? 'unlimited' : remaining

        // Calculate unlock time (24 hours from when limit was first hit)
        let unlocksAt: Date | undefined
        if (profile.limitHitUploadAt) {
            unlocksAt = new Date(profile.limitHitUploadAt.getTime() + 24 * 60 * 60 * 1000)
        } else {
            // If not yet recorded, record it now
            const now = new Date()
            await recordUploadLimitHit(userId)
            unlocksAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }

        return {
            allowed: false,
            remaining: remaining === 'unlimited' ? 'unlimited' : 0,
            reason: `Monthly upload limit reached (${limit}). Resets next month or upgrade for higher limits.`,
            unlocksAt
        }
    }

    return { allowed: true, remaining }
}

/**
 * Validate file size against plan limits
 */
export async function validateFileSize(userId: string, fileSizeMB: number): Promise<{ allowed: boolean; maxSize: number; reason?: string }> {
    const profile = await getUserProfile(userId)
    if (!profile) return { allowed: false, maxSize: 0, reason: 'User not found' }

    const maxFileSize = PLAN_CONFIGS[profile.subscriptionPlan].limits.maxFileSize

    if (fileSizeMB > maxFileSize) {
        return {
            allowed: false,
            maxSize: maxFileSize,
            reason: `File exceeds max size for ${profile.subscriptionPlan} plan (${maxFileSize}MB limit). Upgrade to increase file size limit.`
        }
    }

    return { allowed: true, maxSize: maxFileSize }
}

/**
 * Record that user hit their chat limit
 */
async function recordChatLimitHit(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('users')
        .update({ limit_hit_chat_at: new Date().toISOString() })
        .eq('id', userId)

    if (error) {
        console.error('Error recording chat limit hit:', error)
        return false
    }
    return true
}

/**
 * Record that user hit their file upload limit
 */
async function recordUploadLimitHit(userId: string): Promise<boolean> {
    const { error } = await supabase
        .from('users')
        .update({ limit_hit_upload_at: new Date().toISOString() })
        .eq('id', userId)

    if (error) {
        console.error('Error recording upload limit hit:', error)
        return false
    }
    return true
}

/**
 * Increment chat counter
 */
export async function incrementChats(userId: string): Promise<boolean> {
    // First check and reset if needed
    await checkAndResetUsage(userId)

    // Manual increment since we changed the column name and RPC might be outdated
    const { data, error: fetchError } = await supabase
        .from('users')
        .select('daily_chats')
        .eq('id', userId)
        .single()

    if (fetchError || !data) return false

    const { error: updateError } = await supabase
        .from('users')
        .update({ daily_chats: (data.daily_chats || 0) + 1 })
        .eq('id', userId)

    return !updateError
}

/**
 * Increment file upload counter
 */
export async function incrementFileUploads(userId: string, count: number = 1): Promise<boolean> {
    // First check and reset if needed
    await checkAndResetUsage(userId)

    const { data, error: fetchError } = await supabase
        .from('users')
        .select('monthly_file_uploads')
        .eq('id', userId)
        .single()

    if (fetchError || !data) return false

    const { error: updateError } = await supabase
        .from('users')
        .update({ monthly_file_uploads: (data.monthly_file_uploads || 0) + count })
        .eq('id', userId)

    return !updateError
}

/**
 * Update user profile information
 */
export async function updateUserProfile(
    userId: string,
    updates: Partial<{
        fullName: string | null
        school: string | null
        gradeLevels: string[] | null
        profileImageUrl: string | null
    }>
): Promise<boolean> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName
    if (updates.school !== undefined) dbUpdates.school = updates.school
    if (updates.gradeLevels !== undefined) dbUpdates.grade_levels = updates.gradeLevels
    if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl

    const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)

    if (error) {
        console.error('Error updating user profile:', error)
        return false
    }

    return true
}

/**
 * Update user subscription plan
 * Also clears limit locks when upgrading (auto-unlock)
 */
export async function updateSubscriptionPlan(
    userId: string,
    plan: PlanType
): Promise<boolean> {
    const updates: Record<string, any> = {
        subscription_plan: plan
    }

    // Auto-unlock if upgrading from free plan
    // Pro and Plus users don't have limits anyway
    if (plan !== 'free') {
        updates.limit_hit_chat_at = null
        updates.limit_hit_upload_at = null
        updates.daily_chats = 0
        updates.monthly_file_uploads = 0
    }

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

    if (error) {
        console.error('Error updating subscription plan:', error)
        return false
    }

    return true
}

/**
 * Calculate remaining time until unlock (in milliseconds)
 * Returns negative if unlock time has passed
 */
export function getTimeUntilUnlock(unlocksAt: Date): number {
    return unlocksAt.getTime() - new Date().getTime()
}

/**
 * Format remaining time as human-readable string
 */
export function formatTimeUntilUnlock(milliseconds: number): string {
    if (milliseconds <= 0) return 'Available now'

    const hours = Math.floor(milliseconds / (60 * 60 * 1000))
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}
