export type ChatMode = 'general' | 'code' | 'write' | 'search' | 'build'

export type ChatModeStatus = 'enabled' | 'disabled'

export type ChatModeConfig = {
  id: ChatMode
  label: string
  description: string
  placeholder: string
  status: ChatModeStatus
}

export const DEFAULT_CHAT_MODE: ChatMode = 'general'

export const CHAT_MODES: readonly ChatModeConfig[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Ask anything and get a clear, direct answer.',
    placeholder: 'What do you need help with?',
    status: 'enabled',
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Build, debug, review, and deploy code.',
    placeholder: 'Describe the code you need...',
    status: 'enabled',
  },
  {
    id: 'write',
    label: 'Write',
    description: 'Draft, edit, and create content.',
    placeholder: 'Describe what you want to write...',
    status: 'enabled',
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Research with real-time web information and citations.',
    placeholder: 'What do you want to research?',
    status: 'enabled',
  },
  {
    id: 'build',
    label: 'Build',
    description: 'Create projects, plans, and implementation roadmaps.',
    placeholder: 'Describe what you want to build...',
    status: 'enabled',
  },
] as const satisfies readonly ChatModeConfig[]

const CHAT_MODE_IDS = new Set<ChatMode>(CHAT_MODES.map((mode) => mode.id))

const CHAT_MODE_CONFIG_BY_ID = Object.fromEntries(
  CHAT_MODES.map((mode) => [mode.id, mode])
) as Record<ChatMode, (typeof CHAT_MODES)[number]>

const CHAT_MODE_SYSTEM_PROMPTS = {
  general: 'You are Tera in General mode. Answer the user clearly and directly, explain important reasoning, and offer useful next steps when helpful.',
  code: 'You are Tera in Code mode. Build, debug, review, and deploy code. Write clean, correct, and well-structured code with clear explanations.',
  write: 'You are Tera in Write mode. Draft, edit, and create content. Focus on clarity, style, and structure to produce polished writing.',
  search: 'You are Tera in Search mode. Research with real-time web information and citations. Prioritize accuracy, sourcing, and up-to-date results.',
  build: 'You are Tera in Build mode. Create projects, plans, and implementation roadmaps. Break down complex goals into actionable steps.',
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

export function getSystemPromptForMode(mode: ChatMode): string {
  return CHAT_MODE_SYSTEM_PROMPTS[mode] || CHAT_MODE_SYSTEM_PROMPTS.general
}
