// Plan configuration and limits
// Centralized definitions for all subscription plans

export type PlanType = 'free' | 'pro' | 'plus'

export interface PlanLimits {
    messagesPerDay: number | 'unlimited'
    fileUploadsPerMonth: number | 'unlimited'
    webSearchesPerMonth: number | 'unlimited'
    maxFileSize: number // in MB
    storageBytes: number // in bytes
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
            fileUploadsPerMonth: 90,
            webSearchesPerMonth: 5,
            maxFileSize: 10,
            storageBytes: 500 * 1024 * 1024, // 500MB
            features: ['basic-chat', 'basic-tools', 'file-uploads']
        },
        features: [
            'Unlimited AI conversations',
            '150 AI Computational Credits',
            '90 file uploads per month (10MB each)',
            '500MB storage',
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
            fileUploadsPerMonth: 750,
            webSearchesPerMonth: 100,
            maxFileSize: 500,
            storageBytes: 5 * 1024 * 1024 * 1024, // 5GB
            features: ['advanced-chat', 'all-tools', 'file-uploads', 'export', 'deep-research', 'priority-support']
        },
        features: [
            'Everything in Free, plus:',
            '1,500 AI Computational Credits',
            '750 file uploads per month (500MB each)',
            '5GB storage',
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
            fileUploadsPerMonth: 'unlimited',
            webSearchesPerMonth: 300,
            maxFileSize: 2000,
            storageBytes: 20 * 1024 * 1024 * 1024, // 20GB
            features: ['advanced-chat', 'all-tools', 'file-uploads', 'export', 'admin', 'analytics', 'deep-research', 'priority-support']
        },
        features: [
            'Everything in Pro, plus:',
            '5,000 AI Computational Credits',
            'Unlimited file uploads (2GB each)',
            '20GB storage',
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
    const limit = PLAN_CONFIGS[plan].limits.fileUploadsPerMonth
    return limit === 'unlimited' || currentCount < limit
}

export function getRemainingChats(plan: PlanType, currentCount: number): number | 'unlimited' {
    const limit = PLAN_CONFIGS[plan].limits.messagesPerDay
    if (limit === 'unlimited') return 'unlimited'
    return Math.max(0, limit - currentCount)
}

export function getRemainingFileUploads(plan: PlanType, currentCount: number): number | 'unlimited' {
    const limit = PLAN_CONFIGS[plan].limits.fileUploadsPerMonth
    if (limit === 'unlimited') return 'unlimited'
    return Math.max(0, limit - currentCount)
}

export function getUsagePercentage(limit: number | 'unlimited', current: number): number {
    if (limit === 'unlimited') return 0
    return Math.min(100, (current / limit) * 100)
}
