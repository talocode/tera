import { supabaseServer } from './supabase-server'

export type HomepageStat = {
  value: string
  label: string
}

const FALLBACK_STATS: HomepageStat[] = [
  { value: '50K+', label: 'Active learners' },
  { value: '2M+', label: 'Chat sessions' },
  { value: '10M+', label: 'Prompts processed' },
  { value: '99.9%', label: 'Uptime' },
]

function formatCompactCount(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value)}%`
}

export async function getHomepageStats(): Promise<HomepageStat[]> {
  try {
    const { data, error } = await supabaseServer.rpc('get_homepage_stats')

    if (error) {
      throw error
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      throw new Error('Homepage stats RPC returned no data')
    }

    return [
      { value: formatCompactCount(Number(row.active_learners || 0)), label: 'Active learners' },
      { value: formatCompactCount(Number(row.chat_sessions || 0)), label: 'Chat sessions' },
      { value: formatCompactCount(Number(row.prompts_processed || 0)), label: 'Prompts processed' },
      { value: formatPercent(Number(row.uptime_percent ?? 0)), label: 'Uptime' },
    ]
  } catch (error) {
    console.error('[homepage_stats_failed]', error)
    return FALLBACK_STATS
  }
}
