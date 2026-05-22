export type ChatMode = 'ask' | 'study' | 'quiz' | 'summarize' | 'image'

export type ChatModeStatus = 'enabled' | 'coming_soon' | 'disabled'

export type ChatModeConfig = {
  id: ChatMode
  label: string
  description: string
  placeholder: string
  status: ChatModeStatus
}

export const DEFAULT_CHAT_MODE: ChatMode = 'ask'

export const CHAT_MODES = [
  {
    id: 'ask',
    label: 'Ask',
    description: 'Ask Tera anything and get a clear, helpful answer.',
    placeholder: 'Ask anything you want to understand...',
    status: 'enabled',
  },
  {
    id: 'study',
    label: 'Study',
    description: 'Learn step by step with guided explanations, examples, and checkpoints.',
    placeholder: 'What topic are you studying?',
    status: 'enabled',
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Practice with questions that test understanding and reinforce learning.',
    placeholder: 'What should Tera quiz you on?',
    status: 'enabled',
  },
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Turn notes, files, or long text into concise summaries and takeaways.',
    placeholder: 'Paste text or describe what you want summarized...',
    status: 'enabled',
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Image generation is coming soon and is not currently enabled.',
    placeholder: 'Image generation is coming soon.',
    status: 'coming_soon',
  },
] as const satisfies readonly ChatModeConfig[]

const CHAT_MODE_IDS = new Set<ChatMode>(CHAT_MODES.map((mode) => mode.id))

const CHAT_MODE_CONFIG_BY_ID = Object.fromEntries(
  CHAT_MODES.map((mode) => [mode.id, mode])
) as Record<ChatMode, (typeof CHAT_MODES)[number]>

const CHAT_MODE_SYSTEM_PROMPTS = {
  ask: 'You are Tera in Ask mode. Answer the user clearly and directly, explain important reasoning, and offer useful next steps when helpful.',
  study: 'You are Tera in Study mode. Teach step by step with patient explanations, concrete examples, short checkpoints, and encouragement that helps the user build durable understanding.',
  quiz: 'You are Tera in Quiz mode. Create focused practice questions, wait for the user to answer when appropriate, then give feedback, explanations, and targeted follow-up practice.',
  summarize: 'You are Tera in Summarize mode. Condense the provided material into accurate, organized summaries with key takeaways, important details, and any action items or open questions.',
  image: 'You are Tera in Image mode. Image generation is coming soon and must remain disabled. Do not generate images; instead, briefly explain that image generation is not available yet and offer to help write or refine an image prompt.',
} as const satisfies Record<ChatMode, string>

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && CHAT_MODE_IDS.has(value as ChatMode)
}

export function normalizeChatMode(value: unknown): ChatMode {
  return isChatMode(value) ? value : DEFAULT_CHAT_MODE
}

export function getChatModeConfig(mode: ChatMode) {
  return CHAT_MODE_CONFIG_BY_ID[mode]
}

export function getChatModeSystemPrompt(mode: ChatMode): string {
  return CHAT_MODE_SYSTEM_PROMPTS[mode]
}
