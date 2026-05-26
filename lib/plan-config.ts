// Plan configuration and limits
// Centralized definitions for all subscription plans

export type PlanType = 'free' | 'pro' | 'plus'

export interface PlanLimits {
    messagesPerDay: number | 'unlimited'
    fileUploadsPerDay: number | 'unlimited'
    webSearchesPerMonth: number | 'unlimited'
    maxFileSize: number // in MB
    features: string[]
}

export interface PlanConfig {
    name: string
    displayName: string
    price: number
    period: string
    description: string
    limits: PlanLimits
    features: string[]
}

// Plan configurations
export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
    free: {
        name: 'free',
        displayName: 'Free',
        price: 0,
        period: '/forever',
        description: 'Unlimited AI conversations, free forever.',
        limits: {
            messagesPerDay: 'unlimited',
            fileUploadsPerDay: 3,
            webSearchesPerMonth: 5,
            maxFileSize: 10,
            features: ['basic-chat', 'basic-tools', 'file-uploads']
        },
        features: [
            'Unlimited AI conversations',
            '150 AI Computational Credits',
            '3 file uploads per day (10MB each)',
            'Basic AI tools & features',
            'Mobile & desktop access',
            'Community support'
        ]
    },
    pro: {
        name: 'pro',
        displayName: 'Pro',
        price: 5,
        period: '/month',
        description: 'Unlock powerful research & productivity tools.',
        limits: {
            messagesPerDay: 'unlimited',
            fileUploadsPerDay: 25,
            webSearchesPerMonth: 100,
            maxFileSize: 500,
            features: ['advanced-chat', 'all-tools', 'file-uploads', 'export', 'deep-research', 'priority-support']
        },
        features: [
            'Everything in Free, plus:',
            '1,500 AI Computational Credits',
            '25 file uploads per day (500MB each)',
            'Deep Research Mode',
            'Export to PDF & Word',
            'Priority email support',
            'All AI tools & features',
            'Advanced customization'
        ]
    },
    plus: {
        name: 'plus',
        displayName: 'Plus',
        price: 15,
        period: '/month',
        description: 'Highest limits plus advanced analytics.',
        limits: {
            messagesPerDay: 'unlimited',
            fileUploadsPerDay: 'unlimited',
            webSearchesPerMonth: 300,
            maxFileSize: 2000,
            features: ['advanced-chat', 'all-tools', 'file-uploads', 'export', 'admin', 'analytics', 'deep-research', 'priority-support']
        },
        features: [
            'Everything in Pro, plus:',
            '5,000 AI Computational Credits',
            'Unlimited file uploads (2GB each)',
            'Advanced analytics dashboard',
            '24/7 priority support',
            'Highest usage limits across Tera'
        ]
    }
}

// Helper functions
export function getPlanConfig(plan: PlanType): PlanConfig {
    return PLAN_CONFIGS[plan]
}

export function hasFeature(plan: PlanType, feature: string): boolean {
    return PLAN_CONFIGS[plan].limits.features.includes(feature)
}

export function canStartChat(plan: PlanType, currentCount: number): boolean {
    const limit = PLAN_CONFIGS[plan].limits.messagesPerDay
    return limit === 'unlimited' || currentCount < limit
}

export function canUploadFile(plan: PlanType, currentCount: number): boolean {
    const limit = PLAN_CONFIGS[plan].limits.fileUploadsPerDay
    return limit === 'unlimited' || currentCount < limit
}

export function getRemainingChats(plan: PlanType, currentCount: number): number | 'unlimited' {
    const limit = PLAN_CONFIGS[plan].limits.messagesPerDay
    if (limit === 'unlimited') return 'unlimited'
    return Math.max(0, limit - currentCount)
}

export function getRemainingFileUploads(plan: PlanType, currentCount: number): number | 'unlimited' {
    const limit = PLAN_CONFIGS[plan].limits.fileUploadsPerDay
    if (limit === 'unlimited') return 'unlimited'
    return Math.max(0, limit - currentCount)
}

export function getUsagePercentage(limit: number | 'unlimited', current: number): number {
    if (limit === 'unlimited') return 0
    return Math.min(100, (current / limit) * 100)
}
