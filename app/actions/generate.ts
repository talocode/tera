"use server"

import { generateAnswerForPrompt } from '@/lib/generate-answer'
import type { GenerateProps } from '@/lib/generate-types'

export async function generateAnswer(props: GenerateProps) {
  return generateAnswerForPrompt(props)
}
