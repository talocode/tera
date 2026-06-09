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

export type ContinueLaterReminder = ContinueLaterSourceItem & {
  remindAt: string
}

export type ContinueLaterArchiveItem = ContinueLaterSourceItem & {
  archivedAt: string
}

export const CONTINUE_LATER_STORAGE_KEY = 'tera_continue_later_queue'
export const CONTINUE_LATER_REMINDERS_STORAGE_KEY = 'tera_continue_later_reminders'
export const CONTINUE_LATER_ARCHIVE_STORAGE_KEY = 'tera_continue_later_archive'
export const CONTINUE_LATER_CHANGE_EVENT = 'tera-continue-later-change'

function dispatchContinueLaterChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CONTINUE_LATER_CHANGE_EVENT))
}

function sameItem(left: { kind: ContinueLaterKind; id: string }, right: { kind: ContinueLaterKind; id: string }) {
  return left.kind === right.kind && left.id === right.id
}

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

export function loadContinueLaterArchive(): ContinueLaterArchiveItem[] {
  if (typeof window === 'undefined') return []

  const stored = window.localStorage.getItem(CONTINUE_LATER_ARCHIVE_STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as ContinueLaterArchiveItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error loading continue-later archive:', error)
    return []
  }
}

export function persistContinueLaterQueue(items: ContinueLaterItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONTINUE_LATER_STORAGE_KEY, JSON.stringify(items))
  dispatchContinueLaterChange()
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
  const next = current.filter((item) => !sameItem(item, { kind, id }))
  persistContinueLaterQueue(next)
  return next
}

export function persistContinueLaterArchive(items: ContinueLaterArchiveItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONTINUE_LATER_ARCHIVE_STORAGE_KEY, JSON.stringify(items))
  dispatchContinueLaterChange()
}

export function archiveContinueLaterItem(item: ContinueLaterSourceItem) {
  const currentArchive = loadContinueLaterArchive()
  const nextArchiveItem: ContinueLaterArchiveItem = { ...item, archivedAt: new Date().toISOString() }
  const nextArchive = [nextArchiveItem, ...currentArchive.filter((existing) => !sameItem(existing, item))]
  persistContinueLaterArchive(nextArchive)

  const nextQueue = loadContinueLaterQueue().filter((existing) => !sameItem(existing, item))
  persistContinueLaterQueue(nextQueue)

  const nextReminders = loadContinueLaterReminders().filter((existing) => !sameItem(existing, item))
  persistContinueLaterReminders(nextReminders)

  return nextArchive
}

export function unarchiveContinueLaterItem(kind: ContinueLaterKind, id: string) {
  const current = loadContinueLaterArchive()
  const next = current.filter((item) => !sameItem(item, { kind, id }))
  persistContinueLaterArchive(next)
  return next
}

export function loadContinueLaterReminders(): ContinueLaterReminder[] {
  if (typeof window === 'undefined') return []

  const stored = window.localStorage.getItem(CONTINUE_LATER_REMINDERS_STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as ContinueLaterReminder[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error loading continue-later reminders:', error)
    return []
  }
}

export function persistContinueLaterReminders(items: ContinueLaterReminder[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONTINUE_LATER_REMINDERS_STORAGE_KEY, JSON.stringify(items))
  dispatchContinueLaterChange()
}

export function setContinueLaterReminder(item: ContinueLaterSourceItem, remindAt: string) {
  const current = loadContinueLaterReminders()
  const nextItem: ContinueLaterReminder = { ...item, remindAt }
  const filtered = current.filter((existing) => !(existing.kind === item.kind && existing.id === item.id))
  const next = [nextItem, ...filtered]
  persistContinueLaterReminders(next)
  return next
}

export function removeContinueLaterReminder(kind: ContinueLaterKind, id: string) {
  const current = loadContinueLaterReminders()
  const next = current.filter((item) => !sameItem(item, { kind, id }))
  persistContinueLaterReminders(next)
  return next
}

export function getContinueLaterOverview(now = Date.now()) {
  const queue = loadContinueLaterQueue()
  const reminders = loadContinueLaterReminders()
  const archive = loadContinueLaterArchive()
  const dueSoon = reminders.filter((reminder) => new Date(reminder.remindAt).getTime() <= now + 24 * 60 * 60 * 1000)

  return {
    queueCount: queue.length,
    reminderCount: reminders.length,
    dueSoonCount: dueSoon.length,
    archiveCount: archive.length,
  }
}
