import { z } from 'zod' // no .ts extension needed for node_modules

export const REWRITE_TEXT_MAX = 20_000
export const DRAFT_BRIEF_MAX = 10_000
export const CODE_MAX = 50_000

export const validStyles = ['clear, founder-like, X post', 'professional', 'academic', 'casual', 'storytelling', 'technical'] as const
export const validTones = ['direct', 'enthusiastic', 'neutral', 'formal', 'warm'] as const
export const validDraftTypes = ['email', 'social_post', 'article', 'lesson_note', 'announcement'] as const
export const validLevels = ['beginner', 'intermediate', 'expert'] as const
export const validExplainFocus = ['logic', 'types', 'security', 'performance', 'best_practices'] as const
export const validReviewFocus = ['bugs', 'types', 'security', 'performance', 'style', 'best_practices'] as const
export const validStrictness = ['relaxed', 'normal', 'strict'] as const

export const rewriteSchema = z.object({
  text: z.string().min(1, 'Text is required.').max(REWRITE_TEXT_MAX, `Text must be under ${REWRITE_TEXT_MAX} characters.`),
  style: z.string().optional().default('professional'),
  tone: z.string().optional().default('neutral'),
  maxLength: z.number().int().positive().optional(),
})

export const draftSchema = z.object({
  type: z.enum(validDraftTypes),
  brief: z.string().min(1, 'Brief is required.').max(DRAFT_BRIEF_MAX, `Brief must be under ${DRAFT_BRIEF_MAX} characters.`),
  audience: z.string().optional().default('general'),
  tone: z.string().optional().default('neutral'),
  constraints: z.object({
    maxLength: z.number().int().positive().optional(),
  }).optional(),
})

export const explainSchema = z.object({
  language: z.string().min(1, 'Language is required.'),
  code: z.string().min(1, 'Code is required.').max(CODE_MAX, `Code must be under ${CODE_MAX} characters.`),
  level: z.enum(validLevels).optional().default('intermediate'),
  focus: z.array(z.enum(validExplainFocus)).optional().default(['logic', 'types']),
})

export const reviewSchema = z.object({
  language: z.string().min(1, 'Language is required.'),
  code: z.string().min(1, 'Code is required.').max(CODE_MAX, `Code must be under ${CODE_MAX} characters.`),
  focus: z.array(z.enum(validReviewFocus)).optional().default(['bugs', 'security']),
  strictness: z.enum(validStrictness).optional().default('normal'),
})

export const writeSchema = z.object({
  language: z.string().min(1, 'Language is required.'),
  task: z.string().min(1, 'Task description is required.').max(10000, 'Task must be under 10000 characters.'),
  context: z.string().max(50000, 'Context must be under 50000 characters.').optional(),
  style: z.string().optional().default('production-ready'),
  generateTests: z.boolean().optional().default(false),
})

export const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1, 'Message content is required.'),
})

export const chatCompletionSchema = z.object({
  model: z.string().optional().default('mistral-small-latest'),
  messages: z.array(chatMessageSchema).min(1, 'At least one message is required.'),
  max_tokens: z.number().int().positive().optional().default(2000),
  temperature: z.number().min(0).max(2).optional().default(0.7),
})
