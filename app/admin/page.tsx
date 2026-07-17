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
  referralSources: {
    bySource: Record<string, { signups: number; active: number; creditsUsed: number; paid: number; revenue: number; orders: number }>
    byMedium: Record<string, { signups: number; active: number; creditsUsed: number; paid: number; revenue: number; orders: number }>
    byCampaign: Record<string, { signups: number; active: number; creditsUsed: number; paid: number; revenue: number; orders: number }>
    organic: { signups: number; active: number; creditsUsed: number; paid: number; revenue: number; orders: number }
    total: number
  }
  onboardingFunnel: {
    viewed: number
    completed: number
    quickstartClicked: number
    firstMessage: number
    firstCredit: number
    completionRate: string
    quickstartRate: string
    messageRate: string
    creditRate: string
    byChoice: Record<string, number>
  }
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
      <div className="tera-page-shell pt-20 md:pt-10">
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

            <div className="mt-8">
              <div className="tera-card">
                <p className="tera-eyebrow">Activation funnel</p>
                <h2 className="mt-3 text-xl font-semibold text-tera-primary">Onboarding to first credit</h2>
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2">
                  {[
                    { label: 'Viewed onboarding', count: analytics.onboardingFunnel.viewed, rate: null },
                    { label: 'Completed', count: analytics.onboardingFunnel.completed, rate: analytics.onboardingFunnel.completionRate },
                    { label: 'Clicked quickstart', count: analytics.onboardingFunnel.quickstartClicked, rate: analytics.onboardingFunnel.quickstartRate },
                    { label: 'First message', count: analytics.onboardingFunnel.firstMessage, rate: analytics.onboardingFunnel.messageRate },
                    { label: 'First credit used', count: analytics.onboardingFunnel.firstCredit, rate: analytics.onboardingFunnel.creditRate },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="tera-card-subtle min-w-[140px] px-4 py-3 text-center">
                        <p className="text-2xl font-semibold text-tera-primary">{step.count}</p>
                        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-tera-secondary">{step.label}</p>
                        {step.rate && <p className="mt-1 text-xs font-medium text-tera-neon">{step.rate}%</p>}
                      </div>
                      {i < 4 && <span className="text-tera-secondary/40">→</span>}
                    </div>
                  ))}
                </div>

                {Object.keys(analytics.onboardingFunnel.byChoice).length > 0 && (
                  <div className="mt-5 border-t border-white/[0.06] pt-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-tera-secondary">Activation by onboarding choice</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
                      {Object.entries(analytics.onboardingFunnel.byChoice).sort((a, b) => b[1] - a[1]).map(([choice, count]) => (
                        <div key={choice} className="text-center">
                          <p className="text-lg font-semibold text-tera-primary">{count}</p>
                          <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary capitalize">{choice}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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

              <div className="tera-card">
                <p className="tera-eyebrow">Traffic sources</p>
                <h2 className="mt-3 text-xl font-semibold text-tera-primary">Activation by source</h2>
                <div className="mt-5 space-y-4">
                  {Object.keys(analytics.referralSources.bySource).length > 0 ? (
                    Object.entries(analytics.referralSources.bySource)
                      .filter(([k]) => k !== '__organic__')
                      .sort((a, b) => b[1].revenue - a[1].revenue || b[1].signups - a[1].signups)
                      .map(([source, m]) => {
                        const activationRate = m.signups > 0 ? ((m.active / m.signups) * 100).toFixed(0) : '0'
                        const conversionRate = m.signups > 0 ? ((m.paid / m.signups) * 100).toFixed(0) : '0'
                        return (
                          <div key={source} className="tera-card-subtle px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-tera-primary">{source}</span>
                              <span className="text-xs text-tera-secondary">{m.signups} signups</span>
                            </div>
                            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-lg font-semibold text-tera-neon">{activationRate}%</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Activated</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-primary">{m.creditsUsed}</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Credits</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-primary">{conversionRate}%</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Paid</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-neon">${m.revenue.toFixed(2)}</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Revenue</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <p className="text-sm text-tera-secondary">No UTM data yet. Share links with ?utm_source= to track.</p>
                  )}
                  <div className="border-t border-white/[0.06] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-tera-secondary">Organic (no UTM)</span>
                      <span className="text-xs text-tera-secondary">{analytics.referralSources.organic.signups} signups</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold text-tera-neon">
                          {analytics.referralSources.organic.signups > 0
                            ? ((analytics.referralSources.organic.active / analytics.referralSources.organic.signups) * 100).toFixed(0)
                            : '0'}%
                        </p>
                        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Activated</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-tera-primary">{analytics.referralSources.organic.creditsUsed}</p>
                        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Credits</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-tera-primary">
                          {analytics.referralSources.organic.signups > 0
                            ? ((analytics.referralSources.organic.paid / analytics.referralSources.organic.signups) * 100).toFixed(0)
                            : '0'}%
                        </p>
                        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Paid</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-tera-neon">${analytics.referralSources.organic.revenue.toFixed(2)}</p>
                        <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Revenue</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tera-card">
                <p className="tera-eyebrow">Campaigns</p>
                <h2 className="mt-3 text-xl font-semibold text-tera-primary">Activation by campaign</h2>
                <div className="mt-5 space-y-4">
                  {Object.keys(analytics.referralSources.byCampaign).length > 0 ? (
                    Object.entries(analytics.referralSources.byCampaign)
                      .filter(([k]) => k !== '__none__')
                      .sort((a, b) => b[1].revenue - a[1].revenue || b[1].signups - a[1].signups)
                      .map(([campaign, m]) => {
                        const activationRate = m.signups > 0 ? ((m.active / m.signups) * 100).toFixed(0) : '0'
                        const conversionRate = m.signups > 0 ? ((m.paid / m.signups) * 100).toFixed(0) : '0'
                        return (
                          <div key={campaign} className="tera-card-subtle px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-tera-primary">{campaign}</span>
                              <span className="text-xs text-tera-secondary">{m.signups} signups</span>
                            </div>
                            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-lg font-semibold text-tera-neon">{activationRate}%</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Activated</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-primary">{m.creditsUsed}</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Credits</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-primary">{conversionRate}%</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Paid</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-neon">${m.revenue.toFixed(2)}</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Revenue</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <p className="text-sm text-tera-secondary">No campaign data yet.</p>
                  )}
                </div>
              </div>

              <div className="tera-card">
                <p className="tera-eyebrow">Medium</p>
                <h2 className="mt-3 text-xl font-semibold text-tera-primary">Activation by medium</h2>
                <div className="mt-5 space-y-4">
                  {Object.keys(analytics.referralSources.byMedium).length > 0 ? (
                    Object.entries(analytics.referralSources.byMedium)
                      .filter(([k]) => k !== '__none__')
                      .sort((a, b) => b[1].revenue - a[1].revenue || b[1].signups - a[1].signups)
                      .map(([medium, m]) => {
                        const activationRate = m.signups > 0 ? ((m.active / m.signups) * 100).toFixed(0) : '0'
                        const conversionRate = m.signups > 0 ? ((m.paid / m.signups) * 100).toFixed(0) : '0'
                        return (
                          <div key={medium} className="tera-card-subtle px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-tera-primary">{medium}</span>
                              <span className="text-xs text-tera-secondary">{m.signups} signups</span>
                            </div>
                            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-lg font-semibold text-tera-neon">{activationRate}%</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Activated</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-primary">{m.creditsUsed}</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Credits</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-primary">{conversionRate}%</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Paid</p>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-tera-neon">${m.revenue.toFixed(2)}</p>
                                <p className="text-[0.6rem] uppercase tracking-[0.18em] text-tera-secondary">Revenue</p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <p className="text-sm text-tera-secondary">No medium data yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="tera-card">
                <p className="tera-eyebrow">Recent signups</p>
                <div className="mt-4 space-y-3">
                  {analytics.recentSignups.length > 0 ? analytics.recentSignups.map((item) => (
                    <div key={item.id} className="tera-card-subtle px-4 py-4">
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
                    <div key={item.id} className="tera-card-subtle px-4 py-4">
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
