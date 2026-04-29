'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import UsageMetricCard from '@/components/UsageMetricCard'
import UsageHistoryChart from '@/components/UsageHistoryChart'
import {
  fetchCreditUsage,
  fetchUserProfile,
  fetchUserSessions,
  fetchUserUsageSummary,
  fetchWeeklyUsageHistory,
  updateUserProfile,
} from '@/app/actions/user'
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

function formatMemberSince(createdAt: Date) {
  return createdAt.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ProfilePage() {
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
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ fullName: '', school: '', gradeLevels: [] as string[] })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  const loadUsageSummary = useCallback(async () => {
    if (!user) return

    setUsageLoading(true)
    try {
      const summary = await fetchUserUsageSummary(user.id)
      if (!summary) throw new Error('Usage summary unavailable')
      setUsageSummary(summary)
      setUsageError(null)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading usage summary:', error)
      setUsageSummary(null)
      setUsageError('Usage counters could not be loaded. Try refreshing in a moment.')
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
    } catch (error) {
      console.error('Error loading credit usage:', error)
      setCreditUsage(null)
      setUsageError('AI credit usage could not be loaded. Try refreshing in a moment.')
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
    } catch (error) {
      console.error('Error loading usage history:', error)
      setUsageHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [user])

  const loadRecentSessions = useCallback(async () => {
    if (!user) return

    setSessionsLoading(true)
    try {
      const sessions = await fetchUserSessions(user.id)
      setRecentSessions(sessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setRecentSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }, [user])

  const loadProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await fetchUserProfile(user.id)
      if (data) {
        setProfile(data)
        setFormData({
          fullName: data.fullName || '',
          school: data.school || '',
          gradeLevels: data.gradeLevels || [],
        })
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshUsage = useCallback(() => {
    void Promise.all([loadUsageSummary(), loadCreditUsage(), loadUsageHistory()])
  }, [loadCreditUsage, loadUsageHistory, loadUsageSummary])

  useEffect(() => {
    if (!user) return

    void Promise.all([
      loadProfile(),
      loadUsageSummary(),
      loadCreditUsage(),
      loadUsageHistory(),
      loadRecentSessions(),
    ])
  }, [loadCreditUsage, loadProfile, loadRecentSessions, loadUsageSummary, loadUsageHistory, user])

  useEffect(() => {
    window.addEventListener(TERA_USAGE_REFRESH_EVENT, refreshUsage)
    return () => window.removeEventListener(TERA_USAGE_REFRESH_EVENT, refreshUsage)
  }, [refreshUsage])

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      await updateUserProfile(user.id, { ...profile, ...formData })
      setProfile({ ...profile, ...formData })
      setEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
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
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Failed to load billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Loading profile...</div>
  }

  if (!profile || !user) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Unable to load profile.</div>
  }

  const email = user.email || ''
  const displayName = formData.fullName || profile.fullName || (email ? email.split('@')[0] : '') || 'User'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const creditMetric = creditUsage
    ? buildUsageMetricSummary(
        creditUsage.used,
        creditUsage.total,
        creditUsage.resetDate ? new Date(creditUsage.resetDate) : null,
      )
    : null

  const usageCardsLoading = usageLoading || creditsLoading
  const usageCardsUnavailable = !usageCardsLoading && (!usageSummary || !creditMetric)
  const weeklyTotal = usageHistory.reduce((sum, day) => sum + day.used, 0)
  const sessionCount = Math.max(1, recentSessions.length)

  const activeLimitNotice = (() => {
    if (!usageSummary || !creditUsage) return null

    if (creditUsage.remaining <= 0) {
      return {
        title: 'Computational credits reached',
        message: 'Tera blocks new prompts when AI computational credits are exhausted.',
      }
    }

    if (!usageSummary.uploads.isUnlimited && usageSummary.uploads.remaining === 0) {
      return {
        title: 'File upload limit reached',
        message: 'Tera can still chat, but new file uploads are blocked until your upload allowance resets or you upgrade.',
      }
    }

    return null
  })()

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Workspace</p>
            <h1 className="tera-title mt-3">Profile</h1>
            <p className="tera-subtitle mt-4">Manage your identity, review live usage across Tera, and keep subscription details close to the main workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {editing ? (
              <>
                <button type="button" onClick={() => setEditing(false)} className="tera-button-secondary" disabled={saving}>Cancel</button>
                <button type="button" onClick={handleSave} className="tera-button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="tera-button-secondary">Edit profile</button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="tera-surface p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-gradient-to-br from-tera-neon/20 to-white/[0.04] text-3xl font-semibold text-tera-primary">
                  {initials}
                </div>
                <div className="min-w-0">
                  {editing ? (
                    <div className="space-y-4">
                      <input value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} className="tera-input w-full" placeholder="Full name" />
                      <input value={formData.school} onChange={(event) => setFormData({ ...formData, school: event.target.value })} className="tera-input w-full" placeholder="Organization or company" />
                      <input value={formData.gradeLevels.join(', ')} onChange={(event) => setFormData({ ...formData, gradeLevels: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })} className="tera-input w-full" placeholder="Interests, comma separated" />
                    </div>
                  ) : (
                    <>
                      <p className="tera-eyebrow">Identity</p>
                      <h2 className="mt-3 text-3xl font-semibold text-tera-primary">{displayName}</h2>
                      <p className="mt-2 text-sm text-tera-secondary">{email}</p>
                      {formData.school && <p className="mt-2 text-sm text-tera-primary/90">{formData.school}</p>}
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-[22px] border border-tera-border bg-white/[0.03] px-5 py-4 text-left md:min-w-[220px]">
                <p className="tera-eyebrow">Member since</p>
                <p className="mt-3 text-xl font-semibold text-tera-primary">{formatMemberSince(profile.createdAt)}</p>
                <p className="mt-2 text-sm text-tera-secondary">Usage cards refresh from the same tracked counters Tera updates while you work.</p>
              </div>
            </div>
          </div>

          <div className="tera-surface p-6 md:p-8">
            <p className="tera-eyebrow">Subscription</p>
            <h2 className="mt-3 text-3xl font-semibold text-tera-primary">{usageSummary?.planDisplayName || profile.subscriptionPlan}</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">Manage billing details and review your computational credits.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.subscriptionPlan === 'free' ? (
                <Link href="/pricing" className="tera-button-primary">Upgrade</Link>
              ) : (
                <button type="button" onClick={handleManageSubscription} disabled={portalLoading} className="tera-button-secondary disabled:opacity-60">
                  {portalLoading ? 'Loading...' : 'Manage'}
                </button>
              )}
              <button type="button" onClick={refreshUsage} disabled={usageCardsLoading} className="tera-button-secondary disabled:opacity-60">
                {usageCardsLoading ? 'Refreshing...' : 'Refresh usage'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="tera-eyebrow">Balance</p>
              <h2 className="mt-3 text-3xl font-semibold text-tera-primary">Usage dashboard</h2>
              <p className="mt-3 text-sm leading-7 text-tera-secondary">A live view of uploads and computational credits. AI conversations are not capped by message count.</p>
            </div>
            {lastUpdated && (
              <p className="pb-1 text-[10px] uppercase tracking-widest text-tera-secondary">
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {usageError && (
            <div className="mt-6 rounded-[22px] border border-red-400/30 bg-red-500/10 px-5 py-4">
              <p className="text-sm font-semibold text-red-100">Usage unavailable</p>
              <p className="mt-2 text-sm leading-7 text-red-50/90">{usageError}</p>
            </div>
          )}

          {activeLimitNotice && (
            <div className="mt-6 rounded-[22px] border border-amber-400/30 bg-amber-500/10 px-5 py-4">
              <p className="text-sm font-semibold text-amber-100">{activeLimitNotice.title}</p>
              <p className="mt-2 text-sm leading-7 text-amber-50/90">{activeLimitNotice.message}</p>
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {usageCardsLoading ? (
              <div className="tera-card lg:col-span-2">
                <p className="text-sm text-tera-secondary">Loading usage summary...</p>
              </div>
            ) : usageCardsUnavailable ? (
              <div className="tera-card lg:col-span-2">
                <p className="text-sm font-medium text-tera-primary">Usage data is temporarily unavailable.</p>
                <p className="mt-2 text-sm text-tera-secondary">Refresh again after a moment. If this persists, the server logs will show the failed usage read.</p>
              </div>
            ) : (
              <>
                <div className="tera-card h-full">
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div>
                      <p className="text-sm font-medium text-tera-secondary">AI conversations</p>
                      <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-tera-primary">Unlimited</p>
                      <p className="mt-3 text-sm text-tera-secondary">Tera does not block you based on a message-count quota. Computational credits are the active AI usage meter.</p>
                    </div>
                    <div>
                      <div className="h-4 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full w-full rounded-full bg-tera-neon" />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4 text-sm text-tera-secondary">
                        <span>Unlimited access</span>
                        <span>Always available</span>
                      </div>
                    </div>
                  </div>
                </div>
                <UsageMetricCard
                  title="AI computational credits"
                  metric={creditMetric!}
                  description="High-complexity tasks consume more credits than simple prompts."
                />
                <UsageMetricCard title="File uploads" metric={usageSummary!.uploads} />
              </>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="tera-card">
            <p className="tera-eyebrow">Weekly trend</p>
            <h2 className="mt-3 text-2xl font-semibold text-tera-primary">Usage history</h2>
            <p className="mt-3 text-sm leading-7 text-tera-secondary">Track credit consumption over the last 7 days.</p>
            <div className="mt-8">
              {historyLoading ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-tera-secondary">Loading history...</div>
              ) : usageHistory.length > 0 ? (
                <div className="space-y-6">
                  <UsageHistoryChart data={usageHistory} />
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-tera-secondary">Avg. intensity</p>
                      <p className="mt-1 text-xl font-semibold text-tera-primary">
                        {Math.round(weeklyTotal / sessionCount)}
                        <span className="ml-1 text-xs font-normal text-tera-secondary">pts/session</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-tera-secondary">7D total</p>
                      <p className="mt-1 text-xl font-semibold text-tera-primary">
                        {weeklyTotal.toLocaleString()}
                        <span className="ml-1 text-xs font-normal text-tera-secondary">credits</span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-tera-secondary">No history data yet.</div>
              )}
            </div>
          </div>

          <div className="tera-card">
            <p className="tera-eyebrow">Recent sessions</p>
            <div className="mt-6 space-y-3">
              {sessionsLoading ? (
                <p className="text-sm text-tera-secondary">Loading recent sessions...</p>
              ) : recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <Link key={session.session_id} href={`/new/${session.session_id}`} className="block rounded-[20px] border border-tera-border bg-white/[0.03] px-4 py-4 transition hover:border-white/16 hover:bg-white/[0.05]">
                    <p className="truncate text-sm font-medium text-tera-primary">{session.title || 'Untitled session'}</p>
                    <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">{session.tool || 'Universal'} · {new Date(session.created_at).toLocaleDateString()}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-tera-secondary">No recent sessions yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
