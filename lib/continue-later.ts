export type ContinueLaterKind = 'chat' | 'note' | 'memory' | 'workflow'

export type ContinueLaterItem = {
  id: string
  kind: ContinueLaterKind
  title: string
  excerpt: string
  href: string
  timestamp: string
  pinnedAt: string
}

export type ContinueLaterSourceItem = Omit<ContinueLaterItem, 'pinnedAt'>

export const CONTINUE_LATER_STORAGE_KEY = 'tera_continue_later_queue'

export function loadContinueLaterQueue(): ContinueLaterItem[] {
  if (typeof window === 'undefined') return []

  const stored = window.localStorage.getItem(CONTINUE_LATER_STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as ContinueLaterItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error loading continue-later queue:', error)
    return []
  }
}

export function persistContinueLaterQueue(items: ContinueLaterItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONTINUE_LATER_STORAGE_KEY, JSON.stringify(items))
}

export function pinContinueLaterItem(item: ContinueLaterSourceItem) {
  const current = loadContinueLaterQueue()
  const nextItem: ContinueLaterItem = { ...item, pinnedAt: new Date().toISOString() }
  const filtered = current.filter((existing) => !(existing.kind === item.kind && existing.id === item.id))
  const next = [nextItem, ...filtered]
  persistContinueLaterQueue(next)
  return next
}

export function unpinContinueLaterItem(kind: ContinueLaterKind, id: string) {
  const current = loadContinueLaterQueue()
  const next = current.filter((item) => !(item.kind === kind && item.id === id))
  persistContinueLaterQueue(next)
  return next
}
