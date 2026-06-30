import { callProvider } from './provider.ts'
import type { z } from 'zod'
import type { rewriteSchema, draftSchema } from '../schemas.ts'

type RewriteInput = z.infer<typeof rewriteSchema>
type DraftInput = z.infer<typeof draftSchema>

export interface RewriteResult {
  text: string
  notes: string[]
}

export interface DraftResult {
  text: string
  title: string | null
}

export async function executeRewrite(input: RewriteInput): Promise<RewriteResult> {
  const systemInstruction = `You are a writing assistant that rewrites text according to the user's requested style and tone.

Return ONLY valid JSON with this exact structure:
{
  "text": "the rewritten text",
  "notes": ["brief note about changes made"]
}

Do NOT include any text outside the JSON object.`

  const userContent = JSON.stringify({
    task: 'rewrite',
    text: input.text,
    style: input.style || 'professional',
    tone: input.tone || 'neutral',
    ...(input.maxLength ? { maxLength: input.maxLength } : {}),
  })

  const raw = await callProvider(systemInstruction, userContent)
  const parsed = tryParseJson<RewriteResult>(raw)

  if (parsed && typeof parsed.text === 'string') {
    return {
      text: parsed.text,
      notes: Array.isArray(parsed.notes) ? parsed.notes.filter((n): n is string => typeof n === 'string') : [],
    }
  }

  return {
    text: raw,
    notes: ['Response was not in expected JSON format. Raw output returned.'],
  }
}

export async function executeDraft(input: DraftInput): Promise<DraftResult> {
  const systemInstruction = `You are a writing assistant that drafts content based on the user's specifications.

Return ONLY valid JSON with this exact structure:
{
  "text": "the full draft content",
  "title": "a suggested title or null if not applicable"
}

Do NOT include any text outside the JSON object.`

  const userContent = JSON.stringify({
    task: 'draft',
    type: input.type,
    brief: input.brief,
    audience: input.audience || 'general',
    tone: input.tone || 'neutral',
    constraints: input.constraints || undefined,
  })

  const raw = await callProvider(systemInstruction, userContent)
  const parsed = tryParseJson<DraftResult>(raw)

  if (parsed && typeof parsed.text === 'string') {
    return {
      text: parsed.text,
      title: typeof parsed.title === 'string' ? parsed.title : null,
    }
  }

  return {
    text: raw,
    title: null,
  }
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
