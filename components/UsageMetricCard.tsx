'use client'

import type { UsageMetricSummary } from '@/lib/profile-usage'

function formatUsageValue(value: number | 'unlimited') {
  return value === 'unlimited' ? 'Unlimited' : value.toLocaleString()
}

function formatResetLabel(resetAt: string | null) {
  if (!resetAt) return 'Reset time unavailable'

  const date = new Date(resetAt)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMs < 0) return 'Resetting now...'
  
  if (diffHours < 1) {
    const mins = Math.round(diffMs / (1000 * 60))
    return `Resets in ${mins} ${mins === 1 ? 'min' : 'mins'}`
  }

  if (diffHours < 48) {
    if (diffDays === 0) {
      return `Resets in ${Math.round(diffHours)} ${Math.round(diffHours) === 1 ? 'hour' : 'hours'}`
    }
    return `Resets in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`
  }

  return `Resets ${date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
  })}`
}

export default function UsageMetricCard({
  title,
  metric,
  accentClassName = 'bg-tera-neon',
  description,
}: {
  title: string
  metric: UsageMetricSummary
  accentClassName?: string
  description?: string
}) {
  const remainingLabel = metric.isUnlimited
    ? 'Unlimited access'
    : `${Math.round(metric.percentageRemaining)}% remaining`

  // Dynamic color based on usage percentage
  const getBarColor = () => {
    if (metric.isUnlimited) return 'bg-tera-neon'
    if (metric.percentageUsed > 90) return 'bg-red-500'
    if (metric.percentageUsed > 75) return 'bg-amber-500'
    return 'bg-tera-neon'
  }

  const activeColor = metric.isUnlimited ? accentClassName : getBarColor()

  return (
    <div className="tera-card h-full">
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <p className="text-sm font-medium text-tera-secondary">{title}</p>
          <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-tera-primary">{remainingLabel}</p>
          <p className="mt-3 text-sm text-tera-secondary">
            Used: <span className="text-tera-primary">{metric.used.toLocaleString()}</span>
            {!metric.isUnlimited && (
              <>
                {' '}
                of <span className="text-tera-primary">{formatUsageValue(metric.limit)}</span>
              </>
            )}
          </p>
        </div>

        <div>
          <div className="h-4 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${activeColor}`}
              style={{ width: `${metric.isUnlimited ? 100 : Math.max(metric.percentageUsed, 4)}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 text-sm text-tera-secondary">
            <span>{metric.isUnlimited ? 'Unlimited plan' : `${formatUsageValue(metric.remaining)} left`}</span>
            <span>{formatResetLabel(metric.resetAt)}</span>
          </div>
          {description && <p className="mt-3 text-sm text-tera-secondary">{description}</p>}
        </div>
      </div>
    </div>
  )
}

