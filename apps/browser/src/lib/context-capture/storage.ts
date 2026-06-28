import type { CaptureHistoryEntry, TeraBrowserContextCapture } from './types'

type Bridge = {
  getCaptureHistory: () => Promise<CaptureHistoryEntry[]>
  addToCaptureHistory: (capture: TeraBrowserContextCapture) => Promise<boolean>
  removeFromCaptureHistory: (id: string) => Promise<boolean>
  clearCaptureHistory: () => Promise<boolean>
  getFullCapture: (id: string) => Promise<TeraBrowserContextCapture | null>
  getRecentCaptures: (limit: number) => Promise<TeraBrowserContextCapture[]>
} | null

function getBridge(): Bridge {
  const w = globalThis as any
  if (w.teraBrowser?.getCaptureHistory) {
    return w.teraBrowser as Bridge
  }
  return null
}

export async function getCaptureHistory(): Promise<CaptureHistoryEntry[]> {
  const bridge = getBridge()
  if (bridge) return bridge.getCaptureHistory()
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tera_browser_capture_history')
      return raw ? JSON.parse(raw) : []
    }
  } catch { }
  return []
}

export async function addToCaptureHistory(capture: TeraBrowserContextCapture): Promise<boolean> {
  const bridge = getBridge()
  if (bridge) return bridge.addToCaptureHistory(capture)
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tera_browser_capture_history')
      const entries: CaptureHistoryEntry[] = raw ? JSON.parse(raw) : []
      entries.unshift({
        id: capture.id,
        url: capture.url,
        title: capture.title,
        capturedAt: capture.capturedAt,
        source: capture.source,
        warnings: capture.warnings,
      })
      localStorage.setItem('tera_browser_capture_history', JSON.stringify(entries.slice(0, 100)))
      return true
    }
  } catch { }
  return false
}

export async function removeFromHistory(id: string): Promise<boolean> {
  const bridge = getBridge()
  if (bridge) return bridge.removeFromCaptureHistory(id)
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tera_browser_capture_history')
      if (!raw) return false
      const entries: CaptureHistoryEntry[] = JSON.parse(raw)
      const filtered = entries.filter((e) => e.id !== id)
      if (filtered.length === entries.length) return false
      localStorage.setItem('tera_browser_capture_history', JSON.stringify(filtered))
      return true
    }
  } catch { }
  return false
}

export async function clearHistory(): Promise<boolean> {
  const bridge = getBridge()
  if (bridge) return bridge.clearCaptureHistory()
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tera_browser_capture_history')
      return true
    }
  } catch { }
  return false
}

export async function getFullCapture(id: string): Promise<TeraBrowserContextCapture | null> {
  const bridge = getBridge()
  if (bridge) return bridge.getFullCapture(id)
  return null
}

export async function getRecentCaptures(limit: number = 10): Promise<TeraBrowserContextCapture[]> {
  const bridge = getBridge()
  if (bridge) return bridge.getRecentCaptures(limit)
  return []
}
