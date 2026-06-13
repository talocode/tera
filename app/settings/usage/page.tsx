'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import UsageMetricCard from '@/components/UsageMetricCard'
import UsageHistoryChart from '@/components/UsageHistoryChart'
import {
  fetchCreditUsage,
  fetchUserProfile,
  fetchUserUsageSummary,
  fetchWeeklyUsageHistory,
} from '@/app/actions/user'
import { CREDITS_PER_USD } from '@/lib/credit-topup'
import { buildUsageMetricSummary, type ProfileUsageSummary } from '@/lib/profile-usage'
import { TERA_USAGE_REFRESH_EVENT } from '@/lib/usage-events'
import type { UserProfile } from '@/lib/usage-tracking'

type CreditUsageState = {
  used: number
  remaining: number
  total: number
  resetDate: string | null
} | null

type UsageHistoryData = {
  date: string
  used: number
}

function formatResetLabel(resetAt: string | null) {
  if (!resetAt) return 'Not scheduled'
  const resetDate = new Date(resetAt)
  if (Number.isNaN(resetDate.getTime())) return 'Not scheduled'
  const now = new Date()
  const diffMs = resetDate.getTime() - now.getTime()
  if (diffMs < 0) return 'Resetting now...'
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 1) return 'Resets today'
  return `Resets in ${diffDays} days`
}

function getCreditColor(remaining: number, total: number): string {
  if (total <= 0) return 'bg-zinc-500'
  const pct = (remaining / total) * 100
  if (pct > 50) return 'bg-emerald-500'
  if (pct > 25) return 'bg-amber-500'
  return 'bg-red-500'
}

function getUsageBarColor(percentageUsed: number, isUnlimited: boolean): string {
  if (isUnlimited) return 'bg-emerald-500'
  if (percentageUsed < 50) return 'bg-emerald-500'
  if (percentageUsed < 75) return 'bg-amber-500'
  return 'bg-red-500'
}

function getDaysRemaining(resetDate: string | null): number | null {
  if (!resetDate) return null
  const reset = new Date(resetDate)
  const now = new Date()
  const diff = reset.getTime() - now.getTime()
  if (diff <= 0) return 0
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function UsagePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [usageSummary, setUsageSummary] = useState<ProfileUsageSummary | null>(null)
  const [creditUsage, setCreditUsage] = useState<CreditUsageState>(null)
  const [usageHistory, setUsageHistory] = useState<UsageHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [usageLoading, setUsageLoading] = useState(true)
  const [creditsLoading, setCreditsLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [topupAmountUsd, setTopupAmountUsd] = useState('1')
  const [creditPackLoading, setCreditPackLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [autoTopupEnabled, setAutoTopupEnabled] = useState(false)
  const [autoTopupAmount, setAutoTopupAmount] = useState('5')
  const [autoTopupSaving, setAutoTopupSaving] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false)

  const loadUsageSummary = useCallback(async () => {
    if (!user) return
    setUsageLoading(true)
    try {
      const summary = await fetchUserUsageSummary(user.id)
      if (!summary) throw new Error('Usage summary unavailable')
      setUsageSummary(summary)
      setUsageError(null)
      setLastUpdated(new Date())
    } catch {
      setUsageSummary(null)
      setUsageError('Usage counters could not be loaded.')
    } finally {
      setUsageLoading(false)
    }
  }, [user])

  const loadCreditUsage = useCallback(async () => {
    if (!user) return
    setCreditsLoading(true)
    try {
      const usage = await fetchCreditUsage(user.id)
      if (!usage) throw new Error('Credit usage unavailable')
      setCreditUsage(usage)
      setUsageError(null)
      setLastUpdated(new Date())
    } catch {
      setCreditUsage(null)
      setUsageError('AI credit usage could not be loaded.')
    } finally {
      setCreditsLoading(false)
    }
  }, [user])

  const loadUsageHistory = useCallback(async () => {
    if (!user) return
    setHistoryLoading(true)
    try {
      const history = await fetchWeeklyUsageHistory(user.id)
      setUsageHistory(history)
    } catch {
      setUsageHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [user])

  const loadProfile = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await fetchUserProfile(user.id)
      if (data) setProfile(data)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    void Promise.all([loadProfile(), loadUsageSummary(), loadCreditUsage(), loadUsageHistory()])
  }, [loadProfile, loadUsageSummary, loadCreditUsage, loadUsageHistory, user])

  useEffect(() => {
    window.addEventListener(TERA_USAGE_REFRESH_EVENT, () => {
      void Promise.all([loadUsageSummary(), loadCreditUsage(), loadUsageHistory()])
    })
  }, [loadUsageSummary, loadCreditUsage, loadUsageHistory])

  const refreshUsage = useCallback(() => {
    void Promise.all([loadUsageSummary(), loadCreditUsage(), loadUsageHistory()])
  }, [loadCreditUsage, loadUsageHistory, loadUsageSummary])

  const handleAddCredits = async () => {
    if (!user?.email) return
    setCreditPackLoading(true)
    try {
      const amountUsd = Number(topupAmountUsd)
      if (!Number.isFinite(amountUsd) || amountUsd < 1) {
        alert('Minimum top-up is $1.')
        return
      }
      const response = await fetch('/api/billing/create-credit-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountUsd,
          email: user.email,
          returnUrl: `${window.location.origin}/settings/usage`,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Failed to create checkout')
      window.location.href = data.checkoutUrl
    } catch (error) {
      alert('Failed to load credit checkout. Please try again.')
    } finally {
      setCreditPackLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return
    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!response.ok) throw new Error('Failed to create portal session')
      const { portalUrl } = await response.json()
      if (portalUrl) window.location.href = portalUrl
    } catch {
      alert('Failed to load billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleSaveAutoTopup = async () => {
    if (!user) return
    setAutoTopupSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          auto_topup_enabled: autoTopupEnabled,
          auto_topup_amount: Number(autoTopupAmount) || 5,
        }),
      })
      if (!response.ok) throw new Error('Failed to save')
    } catch {
      alert('Failed to save auto top-up settings.')
    } finally {
      setAutoTopupSaving(false)
    }
  }

  const usageCardsLoading = usageLoading || creditsLoading
  const creditMetric = creditUsage
    ? buildUsageMetricSummary(creditUsage.used, creditUsage.total, creditUsage.resetDate ? new Date(creditUsage.resetDate) : null)
    : null

  const weeklyTotal = usageHistory.reduce((sum, day) => sum + day.used, 0)
  const topupAmount = Number(topupAmountUsd)
  const estimatedTopupCredits = Number.isFinite(topupAmount) && topupAmount >= 1 ? Math.max(1, Math.floor(topupAmount * CREDITS_PER_USD)) : null

  if (loading) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Loading usage data...</div>
  }

  if (!profile || !user) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Unable to load usage data.</div>
  }

  const creditDaysLeft = getDaysRemaining(creditUsage?.resetDate ?? null)
  const uploadDaysLeft = usageSummary?.uploads.resetAt ? getDaysRemaining(usageSummary.uploads.resetAt) : null

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-6 md:pt-10">
        <div className="tera-page-header gap-5">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Usage & Credits</h1>
            <p className="tera-subtitle mt-4">Track your AI credit consumption, file uploads, web searches, and manage credit top-ups and auto-replenishment.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={refreshUsage} disabled={usageCardsLoading} className="tera-button-secondary disabled:opacity-60">
              {usageCardsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            {profile.subscriptionPlan === 'free' ? (
              <Link href="/pricing" className="tera-button-primary">Upgrade plan</Link>
            ) : (
              <button type="button" onClick={handleManageSubscription} disabled={portalLoading} className="tera-button-secondary disabled:opacity-60">
                {portalLoading ? 'Loading...' : 'Manage subscription'}
              </button>
            )}
          </div>
        </div>

        {usageError && (
          <div className="mt-6 rounded-[22px] border border-red-400/30 bg-red-500/10 px-5 py-4">
            <p className="text-sm font-semibold text-red-100">Usage unavailable</p>
            <p className="mt-2 text-sm leading-7 text-red-50/90">{usageError}</p>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {usageCardsLoading ? (
            <div className="tera-card lg:col-span-2 p-6">
              <p className="text-sm text-tera-secondary">Loading usage data...</p>
            </div>
          ) : (
            <>
              <div className="tera-card h-full">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-tera-secondary">AI computational credits</p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-tera-primary">
                      {creditUsage ? creditUsage.remaining.toLocaleString() : '—'}
                    </p>
                    <p className="mt-3 text-sm text-tera-secondary">
                      Used: <span className="text-tera-primary">{creditUsage?.used.toLocaleString() || '0'}</span>
                      {' '}of <span className="text-tera-primary">{creditUsage?.total.toLocaleString() || '0'}</span>
                      <span className="ml-2 text-xs text-tera-secondary">(~5,000 tokens = 1 credit)</span>
                    </p>
                  </div>
                  <div>
                    <div className="h-4 overflow-hidden rounded-full bg-white/[0.08]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${creditUsage ? getCreditColor(creditUsage.remaining, creditUsage.total) : 'bg-zinc-500'}`}
                        style={{ width: creditUsage ? `${Math.max(((creditUsage.total - creditUsage.used) / creditUsage.total) * 100, 2)}%` : '0%' }}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-tera-secondary">
                      <span>{creditUsage?.remaining.toLocaleString() || '0'} credits left</span>
                      <span>{creditDaysLeft !== null ? `${creditDaysLeft} days until reset` : 'No reset date'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <UsageMetricCard
                title="File uploads (monthly)"
                metric={usageSummary!.uploads}
                description="Resets monthly from your signup date."
              />

              <UsageMetricCard
                title="Web searches (monthly)"
                metric={usageSummary!.webSearches}
                description="Deep Research uses Tavily and is capped monthly."
              />

              <div className="tera-card h-full">
                <div className="flex h-full flex-col justify-between gap-6">
                  <div>
                    <p className="text-sm font-medium text-tera-secondary">AI conversations</p>
                    <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-emerald-400">Unlimited</p>
                    <p className="mt-3 text-sm text-tera-secondary">Tera does not block you based on message count. Computational credits are the active meter.</p>
                  </div>
                  <div>
                    <div className="h-4 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full w-full rounded-full bg-emerald-500" />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-tera-secondary">
                      <span>Always available</span>
                      <span>No limit</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="tera-surface p-6 md:p-8">
            <p className="tera-eyebrow">Top up credits</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Add computational credits</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">
              Credits fuel AI processing. Each credit covers roughly 5,000 tokens of model usage.
            </p>

            {profile.subscriptionPlan === 'free' && creditDaysLeft !== null && creditDaysLeft > 0 && (
              <div className="mt-4 rounded-[16px] border border-amber-400/20 bg-amber-500/10 px-4 py-3">
                <p className="text-xs font-medium text-amber-100">
                  Free plan 30-day cycle: Your current credit window resets in {creditDaysLeft} days.
                  You can add credits now, or wait for the automatic reset.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs uppercase tracking-[0.22em] text-tera-secondary">Amount (USD)</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={topupAmountUsd}
                  onChange={(e) => setTopupAmountUsd(e.target.value)}
                  className="tera-input mt-2 h-11 w-[140px]"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleAddCredits()}
                disabled={creditPackLoading}
                className="tera-button-primary disabled:opacity-60"
              >
                {creditPackLoading ? 'Loading...' : `Add credits`}
              </button>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-tera-secondary">
              {CREDITS_PER_USD} credits per $1
              {estimatedTopupCredits ? ` · ${estimatedTopupCredits.toLocaleString()} credits for $${topupAmount.toFixed(2)}` : ''}
            </p>
          </div>

          <div className="tera-surface p-6 md:p-8">
            <p className="tera-eyebrow">Auto top-up</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Automatic replenishment</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">
              When your credits run low, Tera can automatically add more so you never hit a wall mid-conversation.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-tera-primary">Enable auto top-up</p>
                  <p className="mt-1 text-xs text-tera-secondary">Triggers when credits drop below 10% of your cap.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTopupEnabled(!autoTopupEnabled)}
                  className={`relative h-7 w-12 shrink-0 rounded-full border transition ${autoTopupEnabled ? 'border-emerald-400/40 bg-emerald-500/20' : 'border-tera-border bg-tera-muted'}`}
                  aria-pressed={autoTopupEnabled}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full transition ${autoTopupEnabled ? 'left-6 bg-emerald-400' : 'left-1 bg-zinc-400'}`} />
                </button>
              </div>

              {autoTopupEnabled && (
                <div>
                  <label className="text-xs uppercase tracking-[0.22em] text-tera-secondary">Top-up amount (USD)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={autoTopupAmount}
                    onChange={(e) => setAutoTopupAmount(e.target.value)}
                    className="tera-input mt-2 h-11 w-full"
                  />
                  <p className="mt-2 text-xs text-tera-secondary">
                    Auto top-up uses your saved payment method via Lemon Squeezy.
                  </p>
                </div>
              )}

              <div className="rounded-[16px] border border-tera-border bg-tera-muted/50 px-4 py-3">
                <p className="text-xs font-medium text-tera-secondary">Payment method</p>
                {hasPaymentMethod ? (
                  <p className="mt-1 text-sm text-tera-primary">Card on file</p>
                ) : (
                  <p className="mt-1 text-sm text-tera-secondary">
                    No payment method saved. Add one via the{' '}
                    <button type="button" onClick={handleManageSubscription} className="underline text-tera-primary hover:text-tera-accent">
                      billing portal
                    </button>.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void handleSaveAutoTopup()}
                disabled={autoTopupSaving}
                className="tera-button-secondary w-full justify-center disabled:opacity-60"
              >
                {autoTopupSaving ? 'Saving...' : 'Save auto top-up settings'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="tera-card">
            <p className="tera-eyebrow">Weekly trend</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Credit consumption</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">Track credits used over the last 7 days.</p>
            <div className="mt-8">
              {historyLoading ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-tera-secondary">Loading...</div>
              ) : usageHistory.length > 0 ? (
                <UsageHistoryChart data={usageHistory} />
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-tera-secondary">No history data yet.</div>
              )}
            </div>
            {usageHistory.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-tera-border pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-tera-secondary">7D total</p>
                  <p className="mt-1 text-lg font-semibold text-tera-primary">{weeklyTotal.toLocaleString()}<span className="ml-1 text-xs font-normal text-tera-secondary">credits</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-tera-secondary">Daily avg</p>
                  <p className="mt-1 text-lg font-semibold text-tera-primary">{Math.round(weeklyTotal / 7)}<span className="ml-1 text-xs font-normal text-tera-secondary">credits</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="tera-card">
            <p className="tera-eyebrow">Billing cycle</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Reset schedule</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">When each allowance resets and current headroom.</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-[16px] border border-tera-border bg-tera-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-tera-primary">AI credits</p>
                  <p className="mt-1 text-xs text-tera-secondary">
                    {creditUsage ? `${creditUsage.remaining.toLocaleString()} of ${creditUsage.total.toLocaleString()} remaining` : 'Loading...'}
                  </p>
                </div>
                <span className="text-xs text-tera-secondary">{creditDaysLeft !== null ? `${creditDaysLeft}d left` : '—'}</span>
              </div>
              <div className="flex items-center justify-between rounded-[16px] border border-tera-border bg-tera-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-tera-primary">File uploads</p>
                  <p className="mt-1 text-xs text-tera-secondary">
                    {usageSummary?.uploads.isUnlimited ? 'Unlimited' : usageSummary ? `${usageSummary.uploads.remaining} of ${usageSummary.uploads.limit} remaining` : 'Loading...'}
                  </p>
                </div>
                <span className="text-xs text-tera-secondary">{uploadDaysLeft !== null ? `${uploadDaysLeft}d left` : '—'}</span>
              </div>
              <div className="flex items-center justify-between rounded-[16px] border border-tera-border bg-tera-muted/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-tera-primary">Web searches</p>
                  <p className="mt-1 text-xs text-tera-secondary">
                    {usageSummary?.webSearches.isUnlimited ? 'Unlimited' : usageSummary ? `${usageSummary.webSearches.remaining} of ${usageSummary.webSearches.limit} remaining` : 'Loading...'}
                  </p>
                </div>
                <span className="text-xs text-tera-secondary">
                  {usageSummary?.webSearches.resetAt ? formatResetLabel(usageSummary.webSearches.resetAt) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
