'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { isAdminUser } from '@/lib/admin'

interface AnalyticsData {
  summary: {
    totalUsers: number
    newUsersToday: number
    newUsersWeek: number
    newUsersMonth: number
    activeUsersToday: number
    totalChatSessions: number
    chatsToday: number
    avgChatsPerUser: number
    chatLimitHits: number
    uploadLimitHits: number
    lockedOutUsers: number
    upgradeRate: number
    upgradedAfterLimit: number
  }
  subscriptionBreakdown: Record<string, number>
  dailyActivity: Array<{ date: string; chats: number; newUsers: number }>
  topActiveUsers: Array<{ id: string; email: string; subscription_plan: string; chatCount: number }>
  recentSignups: Array<{ id: string; email: string; subscription_plan: string; created_at: string }>
  lockedOutUsers: any[]
  upgradeConversions: any[]
}

function MetricCard({ title, value, subtext }: { title: string; value: string | number; subtext?: string }) {
  return (
    <div className="tera-card">
      <p className="tera-eyebrow">Metric</p>
      <p className="mt-3 text-sm text-tera-secondary">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-tera-primary">{value}</p>
      {subtext && <p className="mt-2 text-xs uppercase tracking-[0.22em] text-tera-secondary">{subtext}</p>}
    </div>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user && loading) return
    if (!user) {
      router.push('/auth/signin')
      return
    }
    if (!isAdminUser(user.email)) {
      setAuthorized(false)
      setLoading(false)
      setError('Access denied')
      return
    }
    setAuthorized(true)
    void fetchAnalytics()
  }, [loading, router, user])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ userId: user?.id }),
      })
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="tera-page flex items-center justify-center text-sm text-tera-secondary">Loading...</div>
  }

  if (!authorized) {
    return (
      <div className="tera-page flex items-center justify-center px-4 text-center">
        <div className="tera-card max-w-md">
          <p className="tera-eyebrow">Admin</p>
          <h1 className="mt-3 text-2xl font-semibold text-tera-primary">Access denied</h1>
          <p className="mt-3 text-sm leading-7 text-tera-secondary">{error || 'You do not have permission to view the admin dashboard.'}</p>
          <Link href="/new" className="tera-button-secondary mt-6">Return to workspace</Link>
        </div>
      </div>
    )
  }

  const maxChats = Math.max(...(analytics?.dailyActivity?.map((item) => item.chats) || [1]))

  return (
    <div className="tera-page">
      <div className="tera-page-shell pt-24 md:pt-10">
        <div className="tera-page-header">
          <div>
            <p className="tera-eyebrow">Admin</p>
            <h1 className="tera-title mt-3">Analytics dashboard</h1>
            <p className="tera-subtitle mt-4">Monitor user growth, chat activity, limits, and upgrade conversion from one dark dashboard.</p>
          </div>
          <button type="button" onClick={fetchAnalytics} disabled={loading} className="tera-button-secondary disabled:opacity-60">
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && error !== 'Access denied' && (
          <div className="mt-6 rounded-[20px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        )}

        {loading ? (
          <div className="mt-8 text-sm text-tera-secondary">Loading analytics...</div>
        ) : analytics ? (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total users" value={analytics.summary.totalUsers} subtext={`+${analytics.summary.newUsersToday} today`} />
              <MetricCard title="Total chats" value={analytics.summary.totalChatSessions} subtext={`${analytics.summary.chatsToday} today`} />
              <MetricCard title="Active users" value={analytics.summary.activeUsersToday} subtext="Today's activity" />
              <MetricCard title="Upgrade rate" value={`${analytics.summary.upgradeRate}%`} subtext={`${analytics.summary.upgradedAfterLimit} after limit`} />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="tera-card">
                <p className="tera-eyebrow">Activity</p>
                <h2 className="mt-3 text-xl font-semibold text-tera-primary">Daily chats</h2>
                <div className="mt-5 space-y-3">
                  {analytics.dailyActivity.map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="w-20 text-sm text-tera-secondary">{day.date}</span>
                      <div className="h-2.5 flex-1 rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-tera-neon" style={{ width: `${maxChats > 0 ? (day.chats / maxChats) * 100 : 0}%` }} />
                      </div>
                      <span className="w-10 text-right text-sm text-tera-primary">{day.chats}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tera-card">
                <p className="tera-eyebrow">Subscriptions</p>
                <h2 className="mt-3 text-xl font-semibold text-tera-primary">Plan breakdown</h2>
                <div className="mt-5 space-y-3">
                  {Object.entries(analytics.subscriptionBreakdown).map(([plan, count]) => {
                    const width = analytics.summary.totalUsers > 0 ? (count / analytics.summary.totalUsers) * 100 : 0
                    return (
                      <div key={plan}>
                        <div className="flex justify-between text-sm">
                          <span className="capitalize text-tera-secondary">{plan}</span>
                          <span className="text-tera-primary">{count}</span>
                        </div>
                        <div className="mt-2 h-2.5 rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-tera-neon" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="tera-card">
                <p className="tera-eyebrow">Recent signups</p>
                <div className="mt-4 space-y-3">
                  {analytics.recentSignups.length > 0 ? analytics.recentSignups.map((item) => (
                    <div key={item.id} className="rounded-[20px] border border-tera-border bg-white/[0.03] px-4 py-4">
                      <p className="text-sm font-medium text-tera-primary">{item.email}</p>
                      <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">{item.subscription_plan || 'free'} · {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  )) : <p className="text-sm text-tera-secondary">No recent signups.</p>}
                </div>
              </div>

              <div className="tera-card">
                <p className="tera-eyebrow">Top users</p>
                <div className="mt-4 space-y-3">
                  {analytics.topActiveUsers.length > 0 ? analytics.topActiveUsers.map((item) => (
                    <div key={item.id} className="rounded-[20px] border border-tera-border bg-white/[0.03] px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-tera-primary">{item.email}</p>
                          <p className="mt-1 text-[0.68rem] uppercase tracking-[0.22em] text-tera-secondary">{item.subscription_plan || 'free'}</p>
                        </div>
                        <p className="text-2xl font-semibold text-tera-primary">{item.chatCount}</p>
                      </div>
                    </div>
                  )) : <p className="text-sm text-tera-secondary">No activity data.</p>}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8 text-sm text-tera-secondary">No analytics data available.</div>
        )}
      </div>
    </div>
  )
}
