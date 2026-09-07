export type ChatMode = 'general' | 'code' | 'write' | 'search' | 'build'

const CHAT_MODES: readonly ChatMode[] = ['general', 'code', 'write', 'search', 'build']

export function normalizeChatMode(chatMode?: unknown): ChatMode {
  if (typeof chatMode !== 'string') return 'general'

  const normalized = chatMode.trim().toLowerCase()
  return CHAT_MODES.includes(normalized as ChatMode) ? normalized as ChatMode : 'general'
}

export function getChatModeSystemPrompt(chatMode: ChatMode): string {
  switch (chatMode) {
    case 'code':
      return `CHAT MODE: Code
Build, debug, review, and deploy code with clear explanations.
- Write clean, correct, and well-structured code.
- Explain the logic behind each step.
- Provide practical next steps and edge case considerations.`
    case 'write':
      return `CHAT MODE: Write
Draft, edit, and create polished content.
- Focus on clarity, structure, and persuasive writing.
- Polish prose and tighten language.
- Ensure every sentence earns its place.`
    case 'search':
      return `CHAT MODE: Search
Research with real-time web information and citations.
- Prioritize accuracy, sourcing, and up-to-date results.
- Present findings with clear citations and context.`
    case 'build':
      return `CHAT MODE: Build
Create projects, plans, and implementation roadmaps.
- Break down complex goals into actionable steps.
- Be concrete and execution-oriented.
- Call out tradeoffs, constraints, and the next action.`
    case 'general':
    default:
      return ''
  }
}
