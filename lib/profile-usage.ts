import { getPlanConfig, type PlanType } from './plan-config'

export type UsageLimit = number | 'unlimited'

export interface UsageMetricSummary {
    used: number
    limit: UsageLimit
    remaining: number | 'unlimited'
    percentageUsed: number
    percentageRemaining: number
    isUnlimited: boolean
    resetAt: string | null
}

export interface ProfileUsageSummary {
    plan: PlanType
    planDisplayName: string
    chats: UsageMetricSummary
    uploads: UsageMetricSummary
    webSearches: UsageMetricSummary
}

export function buildUsageMetricSummary(
    used: number,
    limit: UsageLimit,
    resetAt: string | Date | null = null
): UsageMetricSummary {
    const isUnlimited = limit === 'unlimited'
    const remaining = isUnlimited ? 'unlimited' : Math.max(0, limit - used)

    let percentageUsed = 0
    if (!isUnlimited && limit > 0) {
        percentageUsed = Math.min(100, (used / limit) * 100)
    }

    return {
        used,
        limit,
        remaining,
        percentageUsed,
        percentageRemaining: isUnlimited ? 100 : 100 - percentageUsed,
        isUnlimited,
        resetAt: resetAt ? (resetAt instanceof Date ? resetAt.toISOString() : resetAt) : null,
    }
}

export function buildProfileUsageSummary(source: {
    plan: PlanType
    dailyChats: number
    monthlyFileUploads: number
    chatResetDate: string | Date | null
    uploadResetDate?: string | Date | null
    monthlyWebSearches?: number
    webSearchResetDate?: string | Date | null
}): ProfileUsageSummary {
    const planConfig = getPlanConfig(source.plan)

    return {
        plan: source.plan,
        planDisplayName: planConfig.displayName,
        chats: buildUsageMetricSummary(
            source.dailyChats,
            planConfig.limits.messagesPerDay,
            source.chatResetDate,
        ),
        uploads: buildUsageMetricSummary(
            source.monthlyFileUploads,
            planConfig.limits.fileUploadsPerMonth,
            source.uploadResetDate || null,
        ),
        webSearches: buildUsageMetricSummary(
            source.monthlyWebSearches || 0,
            planConfig.limits.webSearchesPerMonth,
            source.webSearchResetDate || null,
        ),
    }
}
