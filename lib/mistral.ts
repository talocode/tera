import type { AttachmentReference } from './attachment'
import type { ChatMode } from './chat-mode'
import { getChatModeSystemPrompt, normalizeChatMode } from './chat-mode'
import { extractTextFromFile } from './extract-text'
import { supabaseServer } from './supabase-server'
import { teraVisualPrompt } from './tera-visual-prompt'

if (!process.env.MISTRAL_API_KEY) {
  throw new Error('Mistral API key missing in environment variables')
}

export const TERA_MODEL_NAME = 'pixtral-12b-2409'

const systemMessage = `You are Tera, the AI learning companion inside https://teraai.chat.
Your job is to help users learn clearly, research well, and turn knowledge into action.

VOICE AND QUALITY BAR:
- Sound calm, smart, and useful.
- Write like a strong product assistant, not like a hype bot.
- Be clear before being clever.
- Prefer precision, structure, and practical value over filler.
- Help the user feel progress quickly.

RESPONSE STYLE:
- Start with the direct answer in 1-2 sentences.
- Then explain only as much as the question needs.
- Prefer short paragraphs and tight bullet lists over long walls of text.
- For simple questions: answer, brief why, practical next step.
- For complex questions: break the idea into clear layers, then give an example.
- Use concrete examples, analogies, and edge cases only when they improve understanding.
- Ask at most one focused follow-up question, and only when it would materially improve the answer.
- Do not end every response with a bundle of generic questions.

FORMATTING:
- Use clean Markdown.
- Use short headers only when they help scanning.
- Use bullets for steps, options, comparisons, and takeaways.
- Bold only the most important labels or phrases.
- Avoid decorative formatting, repetition, and noisy boilerplate.

TEACHING RULES:
- Teach with the assumption that the user wants to understand, not just copy.
- When useful, include one of: a worked example, a short mental model, a practical next action, or a quick check for understanding.
- Do not force all of them into every answer.
- If the user asks for a deeper explanation, expand patiently and concretely.

VISUAL AND FILE CAPABILITIES:
- If the user uploads an image, analyze it directly and use it in your reasoning.
- If the user uploads a file, use its contents as part of the answer.
- If a visual explanation would materially help, offer one briefly.
- If the user explicitly asks for a visual, generate it immediately in the required format.

VISUAL OUTPUT FORMAT:
When generating any visual, chart, diagram, quiz, or spreadsheet, output it inside a json:tera-ui code block.
The JSON must follow the json-render spec format with "root" and "elements" keys.

Here are the components available to you:
${teraVisualPrompt}

GROKIPEDIA KNOWLEDGE AND CITATIONS:
- Grokipedia (https://grokipedia.com) is your primary factual reference layer.
- Use it heavily for factual topics, especially in research-oriented answers.
- Reason in your own words instead of sounding like a quoted encyclopedia.
- Link terms only when the link genuinely helps the user explore further.
- In Research Mode, be more detailed, more rigorous, and include more useful links.
- Do not overlink every noun or turn the answer into a citation dump.
- When helpful, end with: "Explore more on [Grokipedia](https://grokipedia.com)".

GOOGLE SHEETS AND SPREADSHEETS:
- For spreadsheet creation, generate a json:tera-ui block with a Spreadsheet component.
- For spreadsheet edits, generate edit instructions in a json:edit block.
`

function getToolResponseStyle(tool: string, researchMode: boolean): string {
  const normalizedTool = tool.trim().toLowerCase()

  if (researchMode || normalizedTool.includes('research')) {
    return `\nMode Guidance:
- Act like a precise research partner.
- Surface the answer first, then the reasoning, evidence, tradeoffs, and implications.
- Distinguish clearly between what is known, what is likely, and what remains uncertain.
- Prefer synthesis over volume.
- Use citations and links where they add real value.`
  }

  if (normalizedTool.includes('build') || normalizedTool.includes('code') || normalizedTool.includes('project')) {
    return `\nMode Guidance:
- Act like a practical builder's assistant.
- Turn ideas into steps, decisions, examples, checklists, or implementation plans.
- Be concrete and execution-oriented.
- Call out tradeoffs, constraints, and the next action.`
  }

  if (normalizedTool.includes('learn') || normalizedTool.includes('study') || normalizedTool.includes('quiz')) {
    return `\nMode Guidance:
- Act like a strong teacher.
- Explain from first principles.
- Use one simple mental model or worked example when it helps.
- Keep the explanation approachable without sounding childish.`
  }

  return `\nMode Guidance:
- Match the user's immediate goal.
- Be helpful, direct, and productively structured.
- Optimize for clarity and usefulness over length.`
}

function cleanModelResponse(text: string): string {
  let cleaned = text.trim()

  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(?:^|\n)(Do you understand what I just explained\?|What area do you need more explanation on\?|Did you learn something new\?|Would you like a visual explanation[^\n]*\?)(?=\n|$)/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`
}

async function getMemories(userId: string): Promise<string> {
  const { data } = await supabaseServer
    .from('user_memories')
    .select('memory_text, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return ''
  return data.map((m: any) => `- ${m.memory_text}`).join('\n')
}

async function saveMemory(userId: string, memory: string) {
  const { data: existing } = await supabaseServer
    .from('user_memories')
    .select('memory_text')
    .eq('user_id', userId)
    .ilike('memory_text', `%${memory.substring(0, 20)}%`)
    .limit(1)

  if (!existing || existing.length === 0) {
    await supabaseServer.from('user_memories').insert({
      user_id: userId,
      memory_text: memory,
    })
  }
}

async function saveConversationToMemory(userId: string, prompt: string, response: string) {
  await extractMemories(userId, prompt, response)
}

async function extractMemories(userId: string, prompt: string, response: string) {
  try {
    const memoryPrompt = `
    Analyze the following conversation between a user and Tera (AI assistant).
    Extract any specific facts, preferences, context, goals, or patterns about the user that should be remembered.
    Return ONLY the extracted facts as a bulleted list. If nothing significant is worth remembering, return "NO_MEMORY".

    User: ${prompt}
    Tera: ${response.substring(0, 500)}
    `

    const memoryResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: memoryPrompt }],
        temperature: 0.1,
      }),
    })

    const data = await memoryResponse.json()
    const content = data.choices?.[0]?.message?.content

    if (content && !content.includes('NO_MEMORY')) {
      const memories = content.split('\n').filter((line: string) => line.trim().startsWith('-'))
      for (const memory of memories) {
        const cleanMemory = memory.replace(/^-\s*/, '').trim()
        if (cleanMemory) {
          await saveMemory(userId, cleanMemory)
        }
      }
    }
  } catch (error) {
    console.error('Error extracting memories:', error)
  }
}

export async function generateTeacherResponse({
  prompt,
  tool,
  attachments = [] as AttachmentReference[],
  history = [] as { role: 'user' | 'assistant'; content: string }[],
  userId,
  researchMode = false,
  chatMode = 'ask'
  chatMode
}: {
  prompt: string
  tool: string
  attachments?: AttachmentReference[]
  history?: { role: 'user' | 'assistant'; content: string }[]
  userId?: string
  researchMode?: boolean
  chatMode?: ChatMode
}) {
  const imageAttachments = attachments.filter((att) => att.type === 'image')
  const fileAttachments = attachments.filter((att) => att.type === 'file')
  const normalizedChatMode = normalizeChatMode(chatMode)

  if (normalizedChatMode === 'image') {
    return {
      text: 'System: Image mode must be routed to the image generation provider, not the text chat provider.',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    }
  }

  const imageAttachments = attachments.filter(att => att.type === 'image')
  const fileAttachments = attachments.filter(att => att.type === 'file')

  let extractedTexts: string[] = []
  if (fileAttachments.length > 0) {
    const textPromises = fileAttachments.map((file) => extractTextFromFile(file.url, file.name))
    extractedTexts = await Promise.all(textPromises)
  }

  let enhancedPrompt = prompt
  if (extractedTexts.some((text) => text.length > 0)) {
    const fileContents = fileAttachments
      .map((file, idx) => {
        const text = extractedTexts[idx]
        if (text.length > 0) {
          return `File: ${file.name}\nContent:\n${text.slice(0, 10000)}\n`
        }
        return ''
      })
      .filter(Boolean)
      .join('\n---\n\n')

    enhancedPrompt = `${fileContents}\n\nUser Question: ${prompt}`
  }

  const modeSystemPrompt = getChatModeSystemPrompt(normalizedChatMode)

  let systemPromptWithMemory = systemMessage
  if (modeSystemPrompt) {
    systemPromptWithMemory += `

 === CHAT MODE INSTRUCTIONS ===
${modeSystemPrompt}
 === END CHAT MODE INSTRUCTIONS ===`
  }
  if (userId) {
    const memories = await getMemories(userId)
    if (memories) {
      systemPromptWithMemory += `\n\n=== CONTEXT ABOUT THIS USER ===\n`
      systemPromptWithMemory += `\nKEY FACTS YOU REMEMBER:\n${memories}\n`
      systemPromptWithMemory += `\n=== END CONTEXT ===\n\nUse this context to provide personalized responses.`
    }
  }

  const isUniversalMode = tool === 'Universal Companion'
  const toolContext = !isUniversalMode
    ? `\nActive Tool: ${tool}. Fulfill the purpose of this tool.`
    : `\nActive Mode: Universal Companion. Adapt your style to the user's need.`

  const responseBlueprint = researchMode
    ? `\nResponse Blueprint:
- Start with a concise answer or thesis.
- Then use clear sections such as Key Points, Explanation, Evidence, Example, and Next Steps when helpful.
- Prioritize accuracy, depth, and synthesis.
- Include Grokipedia links for the most relevant topics, not every noun.`
    : `\nResponse Blueprint:
- Start with the direct answer.
- Keep the explanation clean and easy to scan.
- Use one example or practical takeaway when it helps.
- End naturally. Do not force generic follow-up questions.`
  const toolStyle = getToolResponseStyle(tool, researchMode)

  toolContext += `\nChat Mode: ${chatMode}.`

  let userContent: any
  if (imageAttachments.length > 0) {
    userContent = [
      { type: 'text', text: `Context: ${toolContext}${responseBlueprint}${toolStyle}\nUser Prompt: ${enhancedPrompt}` },
      ...imageAttachments.map((img) => ({ type: 'image_url', image_url: { url: img.url } })),
    ]
  } else {
    userContent = `Context: ${toolContext}${responseBlueprint}${toolStyle}\nUser Prompt: ${enhancedPrompt}`
  }

  async function retryFetch(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
    try {
      const response = await fetch(url, options)
      if ([503, 502, 504, 429].includes(response.status)) {
        throw new Error(`Service Unavailable: ${response.status}`)
      }
      return response
    } catch (error) {
      if (retries <= 0) throw error
      await new Promise((r) => setTimeout(r, delay))
      return retryFetch(url, options, retries - 1, delay * 2)
    }
  }

  try {
    const response = await retryFetch(
      'https://api.mistral.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: TERA_MODEL_NAME,
          messages: [
            { role: 'system', content: systemPromptWithMemory },
            ...history,
            { role: 'user', content: userContent },
          ],
          temperature: researchMode ? 0.35 : 0.55,
          top_p: 0.9,
          max_tokens: researchMode ? 8000 : 4000,
        }),
      },
      2,
      2000
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Mistral API error: ${response.statusText}`)
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content

    let text = ''
    if (typeof rawContent === 'string') {
      text = rawContent
    } else if (Array.isArray(rawContent)) {
      text = rawContent
        .map((chunk: any) => (chunk && typeof chunk === 'object' && chunk.type === 'text' ? chunk.text || '' : ''))
        .join('')
    }

    const finalText = cleanModelResponse(text)

    if (userId) {
      saveConversationToMemory(userId, prompt, finalText).catch((err) => console.error('Memory save failed:', err))
    }

    const promptTokens = Number(data?.usage?.prompt_tokens || 0)
    const completionTokens = Number(data?.usage?.completion_tokens || 0)
    const totalTokens = Number(data?.usage?.total_tokens || promptTokens + completionTokens || 0)

    return {
      text: finalText || `TERA couldn't build a response for ${tool}.`,
      usage: { promptTokens, completionTokens, totalTokens },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Core AI Generation Error:', message)

    if (/429|Service Unavailable|503|502/.test(message)) {
      return {
        text: 'System: AI service high traffic. Please try again in a moment.',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      }
    }
    return {
      text: `System: An error occurred: ${message}`,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    }
  }
}
