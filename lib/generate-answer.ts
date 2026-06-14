import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import { generateTeacherResponse, TERA_MODEL_NAME } from '@/lib/mistral'
import type { GenerateAnswerResult, GenerateProps } from '@/lib/generate-types'
import { checkAndResetUsageServer, getUserProfileServer, incrementChatsServer, incrementWebSearchesServer } from '@/lib/usage-tracking-server'
import { canUploadFile, getPlanConfig } from '@/lib/plan-config'
import { calculateCreditsForTokens, getUserCreditsRemaining, incrementUserCredits, getPlanCreditCap } from '@/lib/free-plan-credits'
import { sendCreditLimitReachedEmail } from '@/lib/transactional-emails'
import { recordUsageLedgerEvent } from '@/lib/usage-ledger'
import { normalizeChatMode } from '@/lib/ai/chat-modes'
import { buildResearchCitations, formatTavilyResearchContext, searchTavily } from '@/lib/tavily'
import { searchContextDev, formatContextDevSearchContext, buildContextDevCitations } from '@/lib/context-dev'

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

export async function generateAnswerForPrompt({
  prompt,
  tool,
  authorId,
  authorEmail,
  attachments = [],
  sessionId,
  chatId,
  researchMode = false,
  chatMode = 'ask',
}: GenerateProps): Promise<GenerateAnswerResult> {
  const normalizedChatMode = normalizeChatMode(chatMode)
  await checkAndResetUsageServer(authorId)

  let userProfile = await getUserProfileServer(authorId)

  if (!userProfile) {
    console.warn('User profile not found, creating default profile for:', authorId)
    userProfile = {
      id: authorId,
      email: authorEmail || '',
      subscriptionPlan: 'free',
      dailyChats: 0,
      monthlyFileUploads: 0,
      monthlyWebSearches: 0,
      chatResetDate: null,
      uploadResetDate: null,
      webSearchResetDate: null,
      limitHitChatAt: null,
      limitHitUploadAt: null,
      profileImageUrl: null,
      fullName: null,
      school: null,
      gradeLevels: null,
      createdAt: new Date(),
      lemonSqueezyCustomerId: null,
    }
  }

  const profile = userProfile!

  if (attachments.length > 0 && !canUploadFile(profile.subscriptionPlan, profile.monthlyFileUploads)) {
    const planConfig = getPlanConfig(profile.subscriptionPlan)
    const limit = planConfig.limits.fileUploadsPerMonth
    const errorMessage = `You've reached your monthly limit of ${limit} file uploads. Upgrade to Pro or Plus for higher limits.`
    console.error('File upload limit reached:', errorMessage)
    return {
      answer: errorMessage,
      sessionId: sessionId ?? null,
      chatId,
      error: errorMessage,
    }
  }

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
      sessionId: sessionId ?? null,
      chatId,
      error: errorMessage,
    }
  }

  if (creditsRemaining <= 0) {
    const cap = getPlanCreditCap(profile.subscriptionPlan)
    const resetLabel = resetDate
      ? new Date(resetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'in 30 days'
    const errorMessage = `You've reached your monthly credit cap (${cap}). Upgrade your plan now, or wait until your credits reset on ${resetLabel}.`
    const email = profile.email || authorEmail
    if (email) {
      sendCreditLimitReachedEmail({
        userId: authorId,
        email,
        plan: profile.subscriptionPlan,
        resetDate,
      }).catch((sendError) => console.error('[credit_limit_email_failed]', { userId: authorId, error: sendError }))
    }
    await recordUsageLedgerEvent({
      userId: authorId,
      eventType: 'credit_blocked',
      status: 'blocked',
      plan: profile.subscriptionPlan,
      tool,
      model: TERA_MODEL_NAME,
      tokenUsage: 0,
      creditsCharged: 0,
      sessionId: sessionId ?? null,
      metadata: {
        chatId: chatId ?? null,
        resetDate,
        promptLength: prompt.length,
        chatMode: normalizedChatMode,
      },
    })
    return {
      answer: errorMessage,
      sessionId: sessionId ?? null,
      chatId,
      error: errorMessage,
    }
  }

  if (researchMode && !(profile.subscriptionPlan === 'pro' || profile.subscriptionPlan === 'plus')) {
    const errorMessage = 'Deep Research mode is available on Pro and Plus plans.'
    return {
      answer: errorMessage,
      sessionId: sessionId ?? null,
      chatId,
      error: errorMessage,
    }
  }

  if (normalizedChatMode === 'image') {
    const comingSoonMessage = 'Image mode is coming soon. For now, ask Tera for help explaining, planning, or drafting your idea in chat mode.'
    return {
      answer: comingSoonMessage,
      sessionId: sessionId ?? null,
      chatId,
      error: comingSoonMessage,
    }
  }

  let history: { role: 'user' | 'assistant'; content: string }[] = []

  if (sessionId) {
    const { data: historyData } = await supabaseServer
      .from('chat_sessions')
      .select('prompt, response, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyData) {
      history = historyData
        .reverse()
        .map((msg) => [
          { role: 'user' as const, content: msg.prompt },
          { role: 'assistant' as const, content: msg.response },
        ])
        .flat()
    }
  }

  let researchContext = ''
  let researchCitations: NonNullable<GenerateAnswerResult['citations']> = []
  if (researchMode) {
    const planConfig = getPlanConfig(profile.subscriptionPlan)
    const monthlyWebSearchLimit = planConfig.limits.webSearchesPerMonth
    const monthlyWebSearches = profile.monthlyWebSearches || 0

    if (monthlyWebSearchLimit !== 'unlimited' && monthlyWebSearches >= monthlyWebSearchLimit) {
      const resetLabel = profile.webSearchResetDate
        ? new Date(profile.webSearchResetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'next month'
      const errorMessage = `You've reached your monthly web search limit (${monthlyWebSearchLimit}). It resets on ${resetLabel}.`

      await recordUsageLedgerEvent({
        userId: authorId,
        eventType: 'web_search_blocked',
        status: 'blocked',
        plan: profile.subscriptionPlan,
        tool,
        model: TERA_MODEL_NAME,
        tokenUsage: 0,
        creditsCharged: 0,
        sessionId: sessionId ?? null,
        metadata: {
          promptLength: prompt.length,
          chatMode: normalizedChatMode,
          resetDate: profile.webSearchResetDate ? profile.webSearchResetDate.toISOString() : null,
        },
      })

      return {
        answer: errorMessage,
        sessionId: sessionId ?? null,
        chatId,
        error: errorMessage,
      }
    }

    try {
      let searchSucceeded = false

      // Try Context.dev first (primary search engine)
      if (process.env.CONTEXT_DEV_API_KEY) {
        try {
          const ctxResponse = await searchContextDev({
            query: prompt,
            maxResults: 5,
            scrapeToMarkdown: true,
          })

          if (ctxResponse.results?.length) {
            researchContext = formatContextDevSearchContext(ctxResponse)
            researchCitations = buildContextDevCitations(ctxResponse)
            searchSucceeded = true

            await recordUsageLedgerEvent({
              userId: authorId,
              eventType: 'web_search',
              status: 'succeeded',
              plan: profile.subscriptionPlan,
              tool,
              model: TERA_MODEL_NAME,
              tokenUsage: 0,
              creditsCharged: 0,
              sessionId: sessionId ?? null,
              metadata: {
                chatMode: normalizedChatMode,
                resultCount: ctxResponse.results.length,
                provider: 'context.dev',
                creditsConsumed: ctxResponse.key_metadata?.credits_consumed || 0,
                creditsRemaining: ctxResponse.key_metadata?.credits_remaining || null,
                query: prompt,
              },
            })
          }
        } catch (ctxError) {
          console.warn('[context_dev_search_fallback]', { userId: authorId, error: ctxError })
        }
      }

      // Fallback to Tavily if Context.dev failed or is not configured
      if (!searchSucceeded) {
        const tavilyResponse = await searchTavily({
          query: prompt,
          searchDepth: 'advanced',
          maxResults: 5,
          includeAnswer: true,
          includeRawContent: false,
        })

        researchContext = formatTavilyResearchContext(tavilyResponse)
        researchCitations = buildResearchCitations(tavilyResponse)

        await recordUsageLedgerEvent({
          userId: authorId,
          eventType: 'web_search',
          status: 'succeeded',
          plan: profile.subscriptionPlan,
          tool,
          model: TERA_MODEL_NAME,
          tokenUsage: 0,
          creditsCharged: 0,
          sessionId: sessionId ?? null,
          metadata: {
            chatMode: normalizedChatMode,
            resultCount: tavilyResponse.results?.length || 0,
            provider: 'tavily',
            responseTime: tavilyResponse.response_time || null,
            query: prompt,
          },
        })
      }

      await incrementWebSearchesServer(authorId)
    } catch (error) {
      console.error('[web_search_failed]', { userId: authorId, error })
    }
  }

  // Generate the AI response
  const generationResult = await generateTeacherResponse({
    prompt,
    tool,
    attachments,
    history,
    userId: authorId,
    researchMode,
    chatMode: normalizedChatMode,
    researchContext,
  })
  const answer = generationResult.text
  const rawTokenCost = Number(generationResult.usage.totalTokens ?? 0)
  const tokenCost = Number.isFinite(rawTokenCost)
    ? Math.max(1, Math.min(Math.round(rawTokenCost), 2_147_483_647))
    : 1

  const creditsToCharge = calculateCreditsForTokens(tokenCost)
  const currentSessionId = sessionId || crypto.randomUUID()
  const persistedChatMode = chatMode ?? (researchMode ? 'research' : 'ask')
  const metadata = {
    chatMode: persistedChatMode,
    citations: researchCitations.length > 0 ? researchCitations : undefined,
  }

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
    const baseUpdatePayload = { prompt, response: answer, attachments, metadata }
    let updatePayload: Record<string, any> = { ...baseUpdatePayload, token_usage: tokenCost }
    let error: any = null

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await supabaseServer
        .from('chat_sessions')
        .update(updatePayload)
        .eq('id', chatId)
        .eq('user_id', authorId)

      error = result.error

      if (!error) break

      if (isMissingColumnError(error, 'metadata') && 'metadata' in updatePayload) {
        updatePayload = omitField(updatePayload, 'metadata')
        continue
      }
      if (isMissingColumnError(error, 'token_usage') && 'token_usage' in updatePayload) {
        updatePayload = omitField(updatePayload, 'token_usage')
        continue
      }
      break
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
      metadata,
      created_at: new Date().toISOString(),
      session_id: currentSessionId,
      title,
    }

    let insertPayload: Record<string, any> = { ...baseInsertPayload, token_usage: tokenCost }
    let data: { id: string } | null = null
    let error: any = null

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await supabaseServer
        .from('chat_sessions')
        .insert(insertPayload)
        .select('id')
        .single()

      data = result.data
      error = result.error

      if (!error) break

      if (isMissingColumnError(error, 'metadata') && 'metadata' in insertPayload) {
        insertPayload = omitField(insertPayload, 'metadata')
        continue
      }
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

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
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

  await recordUsageLedgerEvent({
    userId: authorId,
    eventType: 'chat_generation',
    status: 'succeeded',
    plan: profile.subscriptionPlan,
    tool,
    model: TERA_MODEL_NAME,
    tokenUsage: tokenCost,
    creditsCharged: creditsToCharge,
    chatSessionId: savedChatId ?? null,
    sessionId: currentSessionId,
      metadata: {
        researchMode,
        chatMode: normalizedChatMode,
        persistenceWarning: persistenceWarning ?? null,
        usageAccountingSucceeded,
        attachmentCount: attachments.length,
        citationsCount: researchCitations.length,
      },
    })

  const warning = [persistenceWarning, !usageAccountingSucceeded ? 'Your response was generated, but usage accounting is delayed.' : '']
    .filter(Boolean)
    .join(' ') || undefined

  revalidatePath('/')
  revalidatePath('/history')
  if (usageAccountingSucceeded) {
    revalidatePath('/profile')
  }

  return {
    answer,
    sessionId: chatPersisted ? currentSessionId : (sessionId ?? null),
    chatId: savedChatId,
    citations: researchCitations,
    warning,
  }
}
