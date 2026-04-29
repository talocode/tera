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
    dailyFileUploads: number
    chatResetDate: string | Date | null
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
            source.dailyFileUploads,
            planConfig.limits.fileUploadsPerDay,
            null, // File uploads usually have a 24h rolling or specific reset
        ),
    }
}
