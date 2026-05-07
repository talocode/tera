export const CHAT_MODES = ['ask', 'image'] as const

export type ChatMode = (typeof CHAT_MODES)[number]

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && CHAT_MODES.includes(value.trim().toLowerCase() as ChatMode)
}

export function normalizeChatMode(value: unknown, fallback: ChatMode = 'ask'): ChatMode {
  if (!isChatMode(value)) {
    return fallback
  }

  return value.trim().toLowerCase() as ChatMode
}
