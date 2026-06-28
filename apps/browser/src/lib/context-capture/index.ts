export type {
  TeraBrowserContextCapture,
  CaptureResult,
  ProviderName,
  ProviderFallbackResult,
  ResearchMode,
  CapturedSource,
  CaptureHistoryEntry,
} from './types'

export { captureFromDocument, validateCaptureUrl } from './extract'
export { redactText, cleanHtmlForCapture, stripHtml, normalizeText, truncateContent, isLikelySensitivePage, hasFormInputs } from './clean'
export { captureViaFallback } from './providers'
export { getCaptureHistory, addToCaptureHistory, removeFromHistory, clearHistory, getFullCapture, getRecentCaptures } from './storage'
export { summarizeCapture, formatCaptureForTera } from './summarize'
export type { SummaryLevel, ContextSummary } from './summarize'

import type { TeraBrowserContextCapture } from './types'
import { captureFromDocument, validateCaptureUrl } from './extract'
import { addToCaptureHistory } from './storage'

export async function captureCurrentPage(doc: Document, url: string, selectedText?: string): Promise<{ ok: true; capture: TeraBrowserContextCapture } | { ok: false; error: string; warnings?: string[] }> {
  const validation = validateCaptureUrl(url)
  if (!validation.valid) {
    return { ok: false, error: validation.error || 'Invalid URL' }
  }

  try {
    const capture = captureFromDocument(doc, url, selectedText)
    try {
      await addToCaptureHistory(capture)
    } catch {
    }
    return { ok: true, capture }
  } catch (err) {
    return { ok: false, error: `Capture failed: ${err instanceof Error ? err.message : String(err)}` }
  }
}
