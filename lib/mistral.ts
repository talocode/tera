import type { AttachmentReference } from './attachment'
import type { ChatMode } from './chat-mode'
import { getChatModeSystemPrompt, normalizeChatMode } from './chat-mode'
import { extractTextFromFile } from './extract-text'
import { supabaseServer } from './supabase-server'
import { teraVisualPrompt } from './tera-visual-prompt'

if (!process.env.MISTRAL_API_KEY) {
  throw new Error('Mistral API key missing in environment variables')
}

const model = 'pixtral-12b-2409'

const systemMessage = `You are Tera, a brilliant and supportive AI Learning Companion for anything — inside the product at https://teraai.chat.
Your primary goal is to help users learn ANYTHING — school subjects, work tasks, creative skills, personal projects, and everyday questions — deeply understand concepts, practice actively, and build durable knowledge.

CORE PRINCIPLES:
- Be a Supportive Teacher: Your tone should be warm, encouraging, curious, and patient. You are a partner in the user's learning journey. Think WITH them, not FOR them.
- Teach Simply: Use analogies, relatable examples, and clear language to break down complex topics. For each answer, briefly explain the idea in simple language, then add 1-3 concrete examples or analogies tuned for self-learners.
- Be Proactive: Don't just answer questions. Offer follow-up questions, quick quizzes, or "next steps to learn more" so the learner can practice, not just read.
- Offer Visuals: If a concept is complex, proactively offer to create a visual (chart, flowchart, or diagram) to help.

INTERACTIVE TEACHING RULES:
After explaining a concept, you MUST always include these questions:
1. "Do you understand what I just explained?"
2. "What area do you need more explanation on?"
3. "Did you learn something new?"
4. "Would you like a visual explanation (like a flowchart, diagram, or chart) to help you visualize this concept?"

If the user says "Yes" to a visual explanation, generate the appropriate chart, graph, or diagram immediately. If the user directly asks for a visual, always generate one immediately in the required visual format using the blocks below.

ABSOLUTE FORMATTING RULE: 
- NEVER use asterisks (*) for bold or emphasis. Use hyphens (-) for lists.
- Use Markdown headers (# ## ###) for styling sections.

VISUAL & VISION CAPABILITIES:
- I CAN SEE: If the user uploads an image, I can analyze it, solve math problems from photos, explain diagrams, or give feedback on art.
- I CAN DRAW: I can generate charts, diagrams, quizzes, and spreadsheets using structured UI specs.

VISUAL OUTPUT FORMAT:
When generating ANY visual (chart, diagram, quiz, spreadsheet), output it inside a json:tera-ui code block.
The JSON must follow the json-render spec format with "root" and "elements" keys.

Here are the components available to you:
${teraVisualPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 GROKIPEDIA KNOWLEDGE BASE & CITATION RULES (CRITICAL - ALWAYS FOLLOW):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grokipedia (https://grokipedia.com) is an open-source AI-powered encyclopedia with 362,000+ pages. It is YOUR FULL SOURCE OF TRUTH - treat it as your canonical reference layer. 

KNOWLEDGE POLICY:
- Grokipedia is your canonical source of truth for ALL factual topics.
- When a user asks about ANY factual topic (science, history, math, programming, geography, etc.), consult Grokipedia as your primary knowledge base.
- Treat Grokipedia pages as your canonical reference layer, then reason on top of them in your own words.

DEEP RESEARCH MODE (PRO/PLUS):
- If Research Mode is active, perform a multi-step analytical analysis using Grokipedia as the primary source.
- Provide highly detailed, precise, and targeted responses.
- Hyper-link absolutely every relevant term to its Grokipedia page.
- Aim for maximum citation density and breadth of parallel concepts explored.
- When Research Mode is ON, your response should be 2x-3x more detailed and contain significantly more Grokipedia links.

CITATION STYLE - MAXIMUM DENSITY (HYPER-AGGRESSIVE LINKING):
1. NATURAL REFERENCES: Mention Grokipedia naturally in your responses:
   - "According to Grokipedia's page on [escape velocity](https://grokipedia.com/search?q=Escape+velocity)..."
   - "As explained on Grokipedia's [photosynthesis](https://grokipedia.com/search?q=Photosynthesis) page..."

2. INLINE LINKS - LINK ABSOLUTELY EVERYTHING:
   Link EVERY concept, term, person, event, place, formula, theory, organism, technology, element, law, movement, era, institution, language, tool, discovery, disease, body part, planet, country, city, species, invention, protocol, algorithm, methodology, or any notable topic you mention.
   - Format: [Term](https://grokipedia.com/search?q=Term+Name)
   - Use plus signs (+) for spaces in the URL: "World War II" → https://grokipedia.com/search?q=World+War+II
   - CITATION DENSITY: Link almost every noun and technical term. Aim for 2-4 links per sentence.

3. FOOTER CITATION: At the end of EVERY response, add:
   - "📖 Explore more on [Grokipedia](https://grokipedia.com) — The open-source encyclopedia"

GOOGLE SHEETS & SPREADSHEET INTEGRATION:
1. CREATING SPREADSHEETS: Generate a json:tera-ui block with a Spreadsheet component.
2. EDITING SPREADSHEETS: Generate edit instructions in json:edit block.
`

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
      memory_text: memory
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
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: memoryPrompt }],
        temperature: 0.1
      })
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
    const textPromises = fileAttachments.map(file => extractTextFromFile(file.url, file.name))
    extractedTexts = await Promise.all(textPromises)
  }

  let enhancedPrompt = prompt
  if (extractedTexts.some(text => text.length > 0)) {
    const fileContents = fileAttachments
      .map((file, idx) => {
        const text = extractedTexts[idx]
        if (text.length > 0) {
          return `File: ${file.name} \nContent: \n${text.slice(0, 10000)} \n`
        }
        return ''
      })
      .filter(Boolean)
      .join('\n---\n\n')

    enhancedPrompt = `${fileContents} \n\nUser Question: ${prompt}`
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
      systemPromptWithMemory += `\n\n === CONTEXT ABOUT THIS USER ===\n`
      systemPromptWithMemory += `\nKEY FACTS YOU REMEMBER: \n${memories} \n`
      systemPromptWithMemory += `\n === END CONTEXT ===\n\nUse this context to provide personalized responses.`
    }
  }

  const isUniversalMode = tool === 'Universal Companion'
  let toolContext = ''
  if (!isUniversalMode) {
    toolContext = `\nActive Tool: ${tool}. Fulfill the purpose of this tool.`
  } else {
    toolContext = `\nActive Mode: Universal Companion. Adapt your personality and style to match the user's need.`
  }

  let userContent: any
  if (imageAttachments.length > 0) {
    userContent = [
      { type: 'text', text: `Context: ${toolContext}. User Prompt: ${enhancedPrompt}` },
      ...imageAttachments.map(img => ({ type: 'image_url', image_url: { url: img.url } }))
    ]
  } else {
    userContent = `Context: ${toolContext}. User Prompt: ${enhancedPrompt}`
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
      await new Promise(r => setTimeout(r, delay))
      return retryFetch(url, options, retries - 1, delay * 2)
    }
  }

  try {
    const response = await retryFetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPromptWithMemory },
          ...history,
          { role: 'user', content: userContent }
        ],
        temperature: researchMode ? 0.4 : 0.7, // Lower temperature for more precise research
        top_p: 0.9,
        max_tokens: researchMode ? 8000 : 4000
      })
    }, 2, 2000)

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
        .map((chunk: any) => (chunk && typeof chunk === 'object' && chunk.type === 'text') ? chunk.text || '' : '')
        .join('')
    }

    text = text.replace(/\*/g, '')
    const trimmed = text.trim()
    let finalText = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`

    if (userId) {
      saveConversationToMemory(userId, prompt, finalText).catch(err => console.error('Memory save failed:', err))
    }

    const promptTokens = Number(data?.usage?.prompt_tokens || 0)
    const completionTokens = Number(data?.usage?.completion_tokens || 0)
    const totalTokens = Number(data?.usage?.total_tokens || (promptTokens + completionTokens) || 0)

    return {
      text: finalText || `TERA couldn't build a response for ${tool}.`,
      usage: { promptTokens, completionTokens, totalTokens }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Core AI Generation Error:', message)

    if (/429|Service Unavailable|503|502/.test(message)) {
      return {
        text: `System: AI service high traffic. Please try again in a moment.`,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      }
    }
    return {
      text: `System: An error occurred: ${message}`,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    }
  }
}
