import type { TeraBrowserContextCapture } from './types'

export type SummaryLevel = 'brief' | 'detailed' | 'key-points'

export type ContextSummary = {
  url: string
  title?: string
  description?: string
  summary: string
  level: SummaryLevel
  wordCount: number
  generatedAt: string
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function generateBriefSummary(capture: TeraBrowserContextCapture): string {
  const parts: string[] = []

  if (capture.title) {
    parts.push(`Title: ${capture.title}`)
  }

  if (capture.description) {
    parts.push(`Description: ${capture.description}`)
  }

  const textPreview = capture.text.substring(0, 300).replace(/\s+/g, ' ').trim()
  if (textPreview) {
    parts.push(`Preview: ${textPreview}...`)
  }

  if (capture.headings.length > 0) {
    const headingText = capture.headings.slice(0, 5).join(' | ')
    parts.push(`Sections: ${headingText}`)
  }

  const wordCount = countWords(capture.text)
  parts.push(`Content: ${wordCount} words, ${capture.links.length} links`)

  return parts.join('\n')
}

function generateDetailedSummary(capture: TeraBrowserContextCapture): string {
  const parts: string[] = []
  parts.push(`# ${capture.title || 'Untitled Page'}`)
  parts.push(`URL: ${capture.url}`)

  if (capture.description) {
    parts.push(`\n${capture.description}`)
  }

  if (capture.headings.length > 0) {
    parts.push('\n## Page Structure')
    for (const h of capture.headings) {
      parts.push(`- ${h}`)
    }
  }

  const cleanText = capture.text
    .replace(/\s+/g, ' ')
    .trim()
  const truncated = cleanText.length > 2000 ? cleanText.substring(0, 2000) + '...' : cleanText
  parts.push('\n## Content')
  parts.push(truncated)

  if (capture.links.length > 0) {
    parts.push(`\n## Links (${capture.links.length})`)
    for (const link of capture.links.slice(0, 20)) {
      parts.push(`- [${link.text}](${link.href})`)
    }
    if (capture.links.length > 20) {
      parts.push(`- ... and ${capture.links.length - 20} more`)
    }
  }

  parts.push(`\n_Captured: ${new Date(capture.capturedAt).toLocaleString()}_`)
  return parts.join('\n')
}

function generateKeyPoints(capture: TeraBrowserContextCapture): string {
  const parts: string[] = []
  parts.push(`Key points from: ${capture.title || capture.url}`)

  if (capture.headings.length > 0) {
    parts.push('\nMain topics:')
    for (const h of capture.headings.slice(0, 10)) {
      parts.push(`- ${h}`)
    }
  }

  const words = capture.text.split(/\s+/).filter(Boolean)
  const wordCount = words.length
  parts.push(`\nContent size: ${wordCount} words`)
  parts.push(`Links found: ${capture.links.length}`)

  if (capture.selectedText) {
    const selectionPreview = capture.selectedText.substring(0, 500).replace(/\s+/g, ' ').trim()
    parts.push(`\nSelected text: "${selectionPreview}${capture.selectedText.length > 500 ? '...' : ''}"`)
  }

  if (capture.warnings.length > 0) {
    parts.push(`\nWarnings: ${capture.warnings.join('; ')}`)
  }

  return parts.join('\n')
}

export function summarizeCapture(capture: TeraBrowserContextCapture, level: SummaryLevel = 'brief'): ContextSummary {
  let summary: string

  switch (level) {
    case 'brief':
      summary = generateBriefSummary(capture)
      break
    case 'detailed':
      summary = generateDetailedSummary(capture)
      break
    case 'key-points':
      summary = generateKeyPoints(capture)
      break
    default:
      summary = generateBriefSummary(capture)
  }

  return {
    url: capture.url,
    title: capture.title,
    description: capture.description,
    summary,
    level,
    wordCount: countWords(capture.text),
    generatedAt: new Date().toISOString(),
  }
}

export function formatCaptureForTera(capture: TeraBrowserContextCapture): string {
  const parts: string[] = []
  parts.push(`URL: ${capture.url}`)

  if (capture.title) {
    parts.push(`Title: ${capture.title}`)
  }

  if (capture.description) {
    parts.push(`Description: ${capture.description}`)
  }

  if (capture.selectedText) {
    parts.push(`\nSelected text:\n${capture.selectedText}`)
  }

  parts.push(`\nPage text:\n${capture.text.substring(0, 30000)}`)

  if (capture.headings.length > 0) {
    parts.push(`\nPage headings:\n${capture.headings.join('\n')}`)
  }

  return parts.join('\n')
}
