export const CHAT_MODES = ['ask', 'image'] as const

export type ChatMode = (typeof CHAT_MODES)[number]

type ChatModeConfig = {
  label: string
  placeholder: string
}

const CHAT_MODE_CONFIG: Record<ChatMode, ChatModeConfig> = {
  ask: {
    label: 'Ask',
    placeholder: 'Ask Tera Anything...',
  },
  image: {
    label: 'Image',
    placeholder: 'Describe the image you want Tera to create...',
  },
}

export function isChatMode(value: unknown): value is ChatMode {
  return typeof value === 'string' && CHAT_MODES.includes(value as ChatMode)
}

export function getChatModeConfig(mode: ChatMode): ChatModeConfig {
  return CHAT_MODE_CONFIG[mode]
}
