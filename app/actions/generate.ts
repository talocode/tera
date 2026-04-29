"use server"

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { generateTeacherResponse } from '@/lib/mistral'
import type { AttachmentReference } from '@/lib/attachment'
import { getUserProfileServer } from '@/lib/usage-tracking-server'
import { incrementChatsServer } from '@/lib/usage-tracking-server'
import { canUploadFile, getPlanConfig } from '@/lib/plan-config'
import { getUserCreditsRemaining, incrementUserCredits, getPlanCreditCap } from '@/lib/free-plan-credits'

type GenerateProps = {
  prompt: string
  tool: string
  authorId: string
  authorEmail?: string
  attachments?: AttachmentReference[]
  sessionId?: string | null
  chatId?: string
  researchMode?: boolean
}

function isMissingColumnError(error: unknown, columnName: string) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const details = [
    'message' in error ? error.message : '',
    'details' in error ? error.details : '',
    'hint' in error ? error.hint : '',
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  return details.includes(columnName.toLowerCase()) && details.includes('column')
}

function omitField<T extends Record<string, any>, K extends keyof T>(payload: T, key: K): Omit<T, K> {
  const { [key]: _removed, ...rest } = payload
  return rest
}

export async function generateAnswer({ prompt, tool, authorId, authorEmail, attachments = [], sessionId, chatId, researchMode = false }: GenerateProps) {
  // Get user profile and check limits
  let userProfile = await getUserProfileServer(authorId)

  // If profile still doesn't exist, create a default one
  if (!userProfile) {
    console.warn('User profile not found, creating default profile for:', authorId)
    userProfile = {
      id: authorId,
      email: authorEmail || '',
      subscriptionPlan: 'free',
      dailyChats: 0,
      dailyFileUploads: 0,
      chatResetDate: null,
      limitHitChatAt: null,
      limitHitUploadAt: null,
      profileImageUrl: null,
      fullName: null,
      school: null,
      gradeLevels: null,
      createdAt: new Date()
    }
  }

  // Check file upload limits if attachments are present
  if (attachments.length > 0 && !canUploadFile(userProfile.subscriptionPlan, userProfile.dailyFileUploads)) {
    const planConfig = getPlanConfig(userProfile.subscriptionPlan)
    const limit = planConfig.limits.fileUploadsPerDay
    const errorMessage = `You've reached your daily limit of ${limit} file uploads. Upgrade to Pro or Plus for higher limits.`
    console.error('File upload limit reached:', errorMessage)
    return {
      answer: errorMessage,
      sessionId: sessionId,
      chatId: chatId,
      error: errorMessage
    }
  }

  // Token-based monthly credit cap gate
  let creditsRemaining: number
  let resetDate: string | null
  try {
    const creditState = await getUserCreditsRemaining(authorId)
    creditsRemaining = creditState.remaining
    resetDate = creditState.resetDate
  } catch (error) {
    console.error('[usage_gate_failed]', { userId: authorId, error })
    const errorMessage = 'Tera could not verify your AI credit balance. Please try again in a moment.'
    return {
      answer: errorMessage,
      sessionId: sessionId,
      chatId: chatId,
      error: errorMessage
    }
  }

  if (creditsRemaining <= 0) {
    const cap = getPlanCreditCap(userProfile.subscriptionPlan)
    const resetLabel = resetDate
      ? new Date(resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'in 30 days'
    const errorMessage = `You've reached your monthly credit cap (${cap}). Upgrade your plan now, or wait until your credits reset on ${resetLabel}.`
    return {
      answer: errorMessage,
      sessionId: sessionId,
      chatId: chatId,
      error: errorMessage
    }
  }

  // Enforce Deep Research entitlement on the server (defense-in-depth)
  if (researchMode && !(userProfile.subscriptionPlan === 'pro' || userProfile.subscriptionPlan === 'plus')) {
    const errorMessage = 'Deep Research mode is available on Pro and Plus plans.'
    return {
      answer: errorMessage,
      sessionId: sessionId,
      chatId: chatId,
      error: errorMessage
    }
  }

  // Fetch chat history if sessionId exists
  let history: { role: 'user' | 'assistant'; content: string }[] = []

  if (sessionId) {
    const { data: historyData } = await supabaseServer
      .from('chat_sessions')
      .select('prompt, response, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyData) {
      // Format history: Oldest -> Newest
      history = historyData
        .reverse()
        .map(msg => [
          { role: 'user' as const, content: msg.prompt },
          { role: 'assistant' as const, content: msg.response }
        ])
        .flat()
    }
  }

  // Generate the AI response
  const generationResult = await generateTeacherResponse({ prompt, tool, attachments, history, userId: authorId, researchMode })
  const answer = generationResult.text
  const rawTokenCost = Number(generationResult.usage.totalTokens ?? 0)
  const tokenCost = Number.isFinite(rawTokenCost)
    ? Math.max(1, Math.min(Math.round(rawTokenCost), 2_147_483_647))
    : 1

  if (tokenCost > creditsRemaining) {
    const cap = getPlanCreditCap(userProfile.subscriptionPlan)
    const resetLabel = resetDate
      ? new Date(resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'in 30 days'
    const errorMessage = `You've reached your monthly credit cap (${cap}). Upgrade your plan now, or wait until your credits reset on ${resetLabel}.`
    return {
      answer: errorMessage,
      sessionId: sessionId,
      chatId: chatId,
      error: errorMessage
    }
  }

  const creditsToCharge = tokenCost
  const currentSessionId = sessionId || crypto.randomUUID()

  // Find existing title if continuing a session
  let existingTitle: string | null = null
  if (sessionId) {
    const { data: titleData } = await supabaseServer
      .from('chat_sessions')
      .select('title')
      .eq('session_id', sessionId)
      .not('title', 'is', null)
      .limit(1)
      .maybeSingle()
    existingTitle = titleData?.title || null
  }

  const title = existingTitle || (prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''))

  let savedChatId = chatId
  let chatPersisted = false
  let persistenceWarning: string | undefined

  if (chatId) {
    const baseUpdatePayload = { prompt, response: answer, attachments }

    let { error } = await supabaseServer
      .from('chat_sessions')
      .update({ ...baseUpdatePayload, token_usage: tokenCost })
      .eq('id', chatId)
      .eq('user_id', authorId)

    if (error && isMissingColumnError(error, 'token_usage')) {
      const retryResult = await supabaseServer
        .from('chat_sessions')
        .update(baseUpdatePayload)
        .eq('id', chatId)
        .eq('user_id', authorId)
      error = retryResult.error
    }

    if (error) {
      console.error('[chat_update_failed]', { userId: authorId, chatId, error })
      persistenceWarning = 'We generated your response, but could not save this chat message.'
    } else {
      chatPersisted = true
    }
  } else {
    const baseInsertPayload = {
      user_id: authorId,
      tool,
      prompt,
      response: answer,
      attachments,
      created_at: new Date().toISOString(),
      session_id: currentSessionId,
      title: title
    }

    let insertPayload: Record<string, any> = { ...baseInsertPayload, token_usage: tokenCost }
    let data: { id: string } | null = null
    let error: any = null

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await supabaseServer
        .from('chat_sessions')
        .insert(insertPayload)
        .select('id')
        .single()

      data = result.data
      error = result.error

      if (!error) break

      if (isMissingColumnError(error, 'token_usage') && 'token_usage' in insertPayload) {
        insertPayload = omitField(insertPayload, 'token_usage')
        continue
      }
      if (isMissingColumnError(error, 'session_id') && 'session_id' in insertPayload) {
        insertPayload = omitField(insertPayload, 'session_id')
        continue
      }
      if (isMissingColumnError(error, 'title') && 'title' in insertPayload) {
        insertPayload = omitField(insertPayload, 'title')
        continue
      }
      break
    }

    if (error) {
      console.error('[chat_insert_failed]', { userId: authorId, sessionId: currentSessionId, error })
      persistenceWarning = 'We generated your response, but could not save this chat message.'
    } else if (data?.id) {
      savedChatId = data.id
      chatPersisted = true
    }
  }

  if (chatPersisted) {
    await incrementChatsServer(authorId)
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const maxAccountingAttempts = 2
  let usageAccountingSucceeded = false

  for (let attempt = 1; attempt <= maxAccountingAttempts; attempt += 1) {
    usageAccountingSucceeded = await incrementUserCredits(authorId, creditsToCharge)
    if (usageAccountingSucceeded) break
    if (attempt < maxAccountingAttempts) await delay(200)
  }

  if (!usageAccountingSucceeded) {
    console.error('[usage_accounting_delayed]', { userId: authorId, sessionId: currentSessionId, chatId: savedChatId ?? null, tokenCost })
  }

  const warning = [persistenceWarning, !usageAccountingSucceeded ? 'Your response was generated, but usage accounting is delayed.' : ''].filter(Boolean).join(' ') || undefined

  revalidatePath('/')
  revalidatePath('/history')
  if (usageAccountingSucceeded) {
    revalidatePath('/profile')
  }

  return { answer, sessionId: chatPersisted ? currentSessionId : (sessionId ?? null), chatId: savedChatId, warning }
}
