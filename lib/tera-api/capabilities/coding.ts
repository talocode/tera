import { callProvider } from './provider.ts'
import type { z } from 'zod'
import type { explainSchema, reviewSchema } from '../schemas.ts'

type ExplainInput = z.infer<typeof explainSchema>
type ReviewInput = z.infer<typeof reviewSchema>

export interface ExplainResult {
  summary: string
  explanation: string
  importantLines: Array<{ line: number; reason: string }>
  risks: string[]
}

export interface ReviewResult {
  summary: string
  issues: Array<{
    severity: 'low' | 'medium' | 'high'
    title: string
    description: string
    suggestion: string
  }>
  improvedCode: string | null
}

export async function executeExplain(input: ExplainInput): Promise<ExplainResult> {
  const systemInstruction = `You are a code explanation assistant. Given a code snippet and context, produce a clear explanation.

Return ONLY valid JSON with this exact structure:
{
  "summary": "one-sentence summary of what the code does",
  "explanation": "detailed explanation of how the code works",
  "importantLines": [{"line": 1, "reason": "why this line is important"}],
  "risks": ["potential risk or concern"]
}

Line numbers start at 1 for the first line of the provided code.
Do NOT include any text outside the JSON object.`

  const userContent = JSON.stringify({
    task: 'explain',
    language: input.language,
    code: input.code,
    level: input.level || 'intermediate',
    focus: input.focus || ['logic', 'types'],
  })

  const raw = await callProvider(systemInstruction, userContent)
  return parseExplainResult(raw)
}

export async function executeReview(input: ReviewInput): Promise<ReviewResult> {
  const systemInstruction = `You are a code review assistant. Given a code snippet, identify issues and suggest improvements.

Return ONLY valid JSON with this exact structure:
{
  "summary": "one-sentence summary of the review findings",
  "issues": [
    {
      "severity": "low|medium|high",
      "title": "short issue title",
      "description": "detailed description of the issue",
      "suggestion": "how to fix or improve it"
    }
  ],
  "improvedCode": "the full improved code or null if no changes needed"
}

Do NOT include any text outside the JSON object.`

  const userContent = JSON.stringify({
    task: 'review',
    language: input.language,
    code: input.code,
    focus: input.focus || ['bugs', 'security'],
    strictness: input.strictness || 'normal',
  })

  const raw = await callProvider(systemInstruction, userContent)
  return parseReviewResult(raw)
}

function tryParseJson<T>(text: string): T | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0]) as T
  } catch {
    return null
  }
}

function parseExplainResult(raw: string): ExplainResult {
  const parsed = tryParseJson<ExplainResult>(raw)
  if (parsed && typeof parsed.summary === 'string' && typeof parsed.explanation === 'string') {
    return {
      summary: parsed.summary,
      explanation: parsed.explanation,
      importantLines: Array.isArray(parsed.importantLines)
        ? parsed.importantLines.filter(
            (l): l is { line: number; reason: string } =>
              typeof l === 'object' && typeof l.line === 'number' && typeof l.reason === 'string'
          )
        : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.filter((r): r is string => typeof r === 'string') : [],
    }
  }

  return {
    summary: 'Code explanation generated.',
    explanation: raw,
    importantLines: [],
    risks: [],
  }
}

function parseReviewResult(raw: string): ReviewResult {
  const parsed = tryParseJson<ReviewResult>(raw)
  if (parsed && typeof parsed.summary === 'string') {
    return {
      summary: parsed.summary,
      issues: Array.isArray(parsed.issues)
        ? parsed.issues.filter(
            (i): i is { severity: 'low' | 'medium' | 'high'; title: string; description: string; suggestion: string } =>
              typeof i === 'object' &&
              typeof i.title === 'string' &&
              typeof i.description === 'string' &&
              typeof i.suggestion === 'string' &&
              ['low', 'medium', 'high'].includes(i.severity)
          )
        : [],
      improvedCode: typeof parsed.improvedCode === 'string' ? parsed.improvedCode : null,
    }
  }

  return {
    summary: 'Code review completed.',
    issues: [],
    improvedCode: null,
  }
}
