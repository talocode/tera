import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseServer as supabase } from '@/lib/supabase-server'
import { isAdminUser } from '@/lib/admin'
import { supportsUsageLedger } from '@/lib/usage-ledger'

function throwIfSupabaseError(error: any, context: string) {
  if (error) {
    throw new Error(`[admin-analytics:${context}] ${error.message || 'Supabase query failed'}`)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminUser(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = await getAnalyticsData()
    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

async function getAnalyticsData() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ledgerAvailable = await supportsUsageLedger()

  const { count: totalUsers, error: totalUsersError } = await supabase.from('users').select('*', { count: 'exact', head: true })
  throwIfSupabaseError(totalUsersError, 'total-users')

  const { count: newUsersToday, error: newUsersTodayError } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStart)
  throwIfSupabaseError(newUsersTodayError, 'new-users-today')

  const { count: newUsersWeek, error: newUsersWeekError } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo)
  throwIfSupabaseError(newUsersWeekError, 'new-users-week')

  const { count: newUsersMonth, error: newUsersMonthError } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo)
  throwIfSupabaseError(newUsersMonthError, 'new-users-month')

  const { count: chatLimitHits, error: chatLimitHitsError } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('limit_hit_chat_at', 'is', null)
  throwIfSupabaseError(chatLimitHitsError, 'chat-limit-hits')

  const { count: uploadLimitHits, error: uploadLimitHitsError } = await supabase.from('users').select('*', { count: 'exact', head: true }).not('limit_hit_upload_at', 'is', null)
  throwIfSupabaseError(uploadLimitHitsError, 'upload-limit-hits')

  const { data: subscriptionBreakdown, error: subscriptionBreakdownError } = await supabase.from('users').select('subscription_plan')
  throwIfSupabaseError(subscriptionBreakdownError, 'subscription-breakdown')

  const plans = { free: 0, pro: 0, plus: 0, school: 0 }
  subscriptionBreakdown?.forEach((user: any) => {
    const plan = user.subscription_plan || 'free'
    if (plans.hasOwnProperty(plan)) { plans[plan as keyof typeof plans]++ }
  })

  const chatCountQuery = ledgerAvailable
    ? supabase.from('usage_ledger').select('*', { count: 'exact', head: true }).eq('event_type', 'chat_generation').eq('status', 'succeeded')
    : supabase.from('chat_sessions').select('*', { count: 'exact', head: true })
  const { count: totalChatSessions, error: totalChatSessionsError } = await chatCountQuery
  throwIfSupabaseError(totalChatSessionsError, 'total-chat-sessions')

  const chatsTodayQuery = ledgerAvailable
    ? supabase.from('usage_ledger').select('*', { count: 'exact', head: true }).eq('event_type', 'chat_generation').eq('status', 'succeeded').gte('created_at', todayStart)
    : supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).gte('created_at', todayStart)
  const { count: chatsToday, error: chatsTodayError } = await chatsTodayQuery
  throwIfSupabaseError(chatsTodayError, 'chats-today')

  const activeUsersQuery = ledgerAvailable
    ? supabase.from('usage_ledger').select('user_id').eq('event_type', 'chat_generation').eq('status', 'succeeded').gte('created_at', todayStart)
    : supabase.from('chat_sessions').select('user_id').gte('created_at', todayStart)
  const { data: activeUsersData, error: activeUsersDataError } = await activeUsersQuery
  throwIfSupabaseError(activeUsersDataError, 'active-users-today')
  const activeUsersToday = new Set(activeUsersData?.map((c: any) => c.user_id) || []).size

  const { data: creditWindowData, error: creditWindowError } = ledgerAvailable
    ? await supabase
        .from('usage_ledger')
        .select('credits_charged, created_at')
        .eq('event_type', 'chat_generation')
        .eq('status', 'succeeded')
        .gte('created_at', thirtyDaysAgo)
    : { data: [], error: null as any }
  throwIfSupabaseError(creditWindowError, 'credit-window')
  const creditsBurnedToday = (creditWindowData || [])
    .filter((row: any) => row.created_at >= todayStart)
    .reduce((sum: number, row: any) => sum + Number(row.credits_charged || 0), 0)
  const creditsBurnedMonth = (creditWindowData || [])
    .reduce((sum: number, row: any) => sum + Number(row.credits_charged || 0), 0)

  const dailyActivity = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const dayChatsQuery = ledgerAvailable
      ? supabase.from('usage_ledger').select('*', { count: 'exact', head: true }).eq('event_type', 'chat_generation').eq('status', 'succeeded').gte('created_at', dayStart.toISOString()).lt('created_at', dayEnd.toISOString())
      : supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).gte('created_at', dayStart.toISOString()).lt('created_at', dayEnd.toISOString())
    const { count: dayChats, error: dayChatsError } = await dayChatsQuery
    throwIfSupabaseError(dayChatsError, `daily-chats-${i}`)

    const { count: dayUsers, error: dayUsersError } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', dayStart.toISOString()).lt('created_at', dayEnd.toISOString())
    throwIfSupabaseError(dayUsersError, `daily-users-${i}`)

    dailyActivity.push({
      date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      chats: dayChats || 0,
      newUsers: dayUsers || 0
    })
  }

  const topUsersQuery = ledgerAvailable
    ? supabase.from('usage_ledger').select('user_id').eq('event_type', 'chat_generation').eq('status', 'succeeded').gte('created_at', sevenDaysAgo)
    : supabase.from('chat_sessions').select('user_id').gte('created_at', sevenDaysAgo)
  const { data: topUsersData, error: topUsersDataError } = await topUsersQuery
  throwIfSupabaseError(topUsersDataError, 'top-users-data')

  const userChatCount: Record<string, number> = {}
  topUsersData?.forEach((chat: any) => { if (chat.user_id) userChatCount[chat.user_id] = (userChatCount[chat.user_id] || 0) + 1 })
  const topUserIds = Object.entries(userChatCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id)

  const { data: topUsersInfo, error: topUsersInfoError } = await supabase.from('users').select('id, email, subscription_plan, created_at').in('id', topUserIds.length > 0 ? topUserIds : ['none'])
  throwIfSupabaseError(topUsersInfoError, 'top-users-info')

  const topActiveUsers = topUsersInfo?.map((user: any) => ({ ...user, chatCount: userChatCount[user.id] || 0 })).sort((a: any, b: any) => b.chatCount - a.chatCount) || []

  const { data: recentSignups, error: recentSignupsError } = await supabase.from('users').select('id, email, subscription_plan, created_at').order('created_at', { ascending: false }).limit(10)
  throwIfSupabaseError(recentSignupsError, 'recent-signups')

  // Referral source breakdown with activation metrics
  const { data: referralData, error: referralError } = await supabase
    .from('users')
    .select('id, utm_source, utm_medium, utm_campaign, referrer_url, landing_page, subscription_plan, free_plan_credits_used, purchased_credits_balance, lemon_squeezy_customer_id')
  throwIfSupabaseError(referralError, 'referral-data')

  // Get all users who have ever used credits (activated)
  const allUserIds = (referralData || []).map((u: any) => u.id)
  const { data: activatedUsers, error: activatedError } = ledgerAvailable
    ? await supabase.from('usage_ledger').select('user_id, credits_charged').eq('event_type', 'chat_generation').eq('status', 'succeeded')
    : { data: [], error: null as any }
  throwIfSupabaseError(activatedError, 'activated-users')

  // Aggregate activation data per user
  const userActivation: Record<string, { creditsUsed: number; hasUsed: boolean }> = {}
  ;(activatedUsers || []).forEach((row: any) => {
    if (!userActivation[row.user_id]) userActivation[row.user_id] = { creditsUsed: 0, hasUsed: false }
    userActivation[row.user_id].creditsUsed += Number(row.credits_charged || 0)
    userActivation[row.user_id].hasUsed = true
  })

  // Build per-source activation metrics
  const sourceMetrics: Record<string, { signups: number; active: number; creditsUsed: number; paid: number }> = {}
  const campaignMetrics: Record<string, { signups: number; active: number; creditsUsed: number; paid: number }> = {}
  const mediumMetrics: Record<string, { signups: number; active: number; creditsUsed: number; paid: number }> = {}
  let organicSignups = 0, organicActive = 0, organicCredits = 0, organicPaid = 0

  const initMetric = () => ({ signups: 0, active: 0, creditsUsed: 0, paid: 0 })

  ;(referralData || []).forEach((user: any) => {
    const isPaid = user.subscription_plan !== 'free' || !!user.lemon_squeezy_customer_id
    const activation = userActivation[user.id]
    const isActive = activation?.hasUsed || false
    const credits = activation?.creditsUsed || 0

    // Source breakdown
    const src = user.utm_source || '__organic__'
    if (!sourceMetrics[src]) sourceMetrics[src] = initMetric()
    sourceMetrics[src].signups++
    if (isActive) sourceMetrics[src].active++
    sourceMetrics[src].creditsUsed += credits
    if (isPaid) sourceMetrics[src].paid++

    // Campaign breakdown
    const camp = user.utm_campaign || '__none__'
    if (!campaignMetrics[camp]) campaignMetrics[camp] = initMetric()
    campaignMetrics[camp].signups++
    if (isActive) campaignMetrics[camp].active++
    campaignMetrics[camp].creditsUsed += credits
    if (isPaid) campaignMetrics[camp].paid++

    // Medium breakdown
    const med = user.utm_medium || '__none__'
    if (!mediumMetrics[med]) mediumMetrics[med] = initMetric()
    mediumMetrics[med].signups++
    if (isActive) mediumMetrics[med].active++
    mediumMetrics[med].creditsUsed += credits
    if (isPaid) mediumMetrics[med].paid++

    // Organic
    if (!user.utm_source) {
      organicSignups++
      if (isActive) organicActive++
      organicCredits += credits
      if (isPaid) organicPaid++
    }
  })

  const { data: upgradedAfterLimit, error: upgradedAfterLimitError } = await supabase.from('users').select('id, email, subscription_plan, limit_hit_chat_at, limit_hit_upload_at, created_at').neq('subscription_plan', 'free').or('limit_hit_chat_at.not.is.null, limit_hit_upload_at.not.is.null')
  throwIfSupabaseError(upgradedAfterLimitError, 'upgraded-after-limit')

  const { data: lockedOutUsers, error: lockedOutUsersError } = await supabase.from('users').select('id, email, subscription_plan, limit_hit_chat_at, limit_hit_upload_at').or(`limit_hit_chat_at.gt.${oneDayAgo}, limit_hit_upload_at.gt.${oneDayAgo}`)
  throwIfSupabaseError(lockedOutUsersError, 'locked-out-users')

  const { data: blockedCreditEvents, error: blockedCreditEventsError } = ledgerAvailable
    ? await supabase
        .from('usage_ledger')
        .select('user_id, created_at')
        .eq('event_type', 'credit_blocked')
        .gte('created_at', sevenDaysAgo)
    : { data: [], error: null as any }
  throwIfSupabaseError(blockedCreditEventsError, 'blocked-credit-events')
  const blockedUsersFromCredits = new Set((blockedCreditEvents || []).map((row: any) => row.user_id)).size

  const { data: recentLimitHits, error: recentLimitHitsError } = await supabase.from('users').select('id, email, subscription_plan, limit_hit_chat_at, limit_hit_upload_at, created_at').or(`limit_hit_chat_at.gte.${sevenDaysAgo}, limit_hit_upload_at.gte.${sevenDaysAgo}`).order('created_at', { ascending: false }).limit(50)
  throwIfSupabaseError(recentLimitHitsError, 'recent-limit-hits')

  const upgradedCount = (upgradedAfterLimit || []).length
  const totalLimitHits = (chatLimitHits || 0) + (uploadLimitHits || 0)
  const upgradeRate = totalLimitHits > 0 ? ((upgradedCount / totalLimitHits) * 100).toFixed(2) : '0.00'
  const avgChatsPerUser = totalUsers && totalUsers > 0 ? Math.round((totalChatSessions || 0) / totalUsers) : 0

  return {
    summary: {
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      newUsersWeek: newUsersWeek || 0,
      newUsersMonth: newUsersMonth || 0,
      activeUsersToday: activeUsersToday || 0,
      totalChatSessions: totalChatSessions || 0,
      chatsToday: chatsToday || 0,
      creditsBurnedToday,
      creditsBurnedMonth,
      avgChatsPerUser,
      chatLimitHits: chatLimitHits || 0,
      uploadLimitHits: uploadLimitHits || 0,
      lockedOutUsers: Math.max((lockedOutUsers || []).length, blockedUsersFromCredits),
      upgradeRate: parseFloat(upgradeRate),
      upgradedAfterLimit: upgradedCount,
    },
    subscriptionBreakdown: plans,
    dailyActivity,
    topActiveUsers: topActiveUsers.slice(0, 10),
    recentSignups: recentSignups || [],
    lockedOutUsers: (lockedOutUsers || []).slice(0, 20),
    recentLimitHits: recentLimitHits || [],
    upgradeConversions: upgradedAfterLimit || [],
    referralSources: {
      bySource: sourceMetrics,
      byMedium: mediumMetrics,
      byCampaign: campaignMetrics,
      organic: { signups: organicSignups, active: organicActive, creditsUsed: organicCredits, paid: organicPaid },
      total: referralData?.length || 0,
    },
  }
}
