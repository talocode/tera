export type ChatMode = 'ask' | 'study' | 'quiz' | 'summarize' | 'image'

const CHAT_MODES: readonly ChatMode[] = ['ask', 'study', 'quiz', 'summarize', 'image']

export function normalizeChatMode(chatMode?: unknown): ChatMode {
  if (typeof chatMode !== 'string') return 'ask'

  const normalized = chatMode.trim().toLowerCase()
  return CHAT_MODES.includes(normalized as ChatMode) ? normalized as ChatMode : 'ask'
}

export function getChatModeSystemPrompt(chatMode: ChatMode): string {
  switch (chatMode) {
    case 'study':
      return `CHAT MODE: Study
Structure the response as a learning-focused lesson that includes:
- A simple explanation of the topic in clear, approachable language.
- A step-by-step breakdown of the concept, process, or solution.
- A concrete example that makes the idea easier to apply.
- A common mistake or misconception to avoid.
- A quick check question so the learner can test understanding.
- An offer to go deeper into any part of the topic.`
    case 'quiz':
      return `CHAT MODE: Quiz
Structure the response as quiz practice that includes:
- A brief topic introduction before the quiz.
- 3-5 questions unless the user asks for a different amount.
- Mixed question types where reasonable, such as multiple choice, short answer, true/false, ordering, or explain-your-reasoning.
- Do not provide answers immediately unless the user explicitly requests them.
- If the user is answering a quiz, grade the answer, explain what is right or wrong, correct misconceptions, and suggest a revision or next practice step.`
    case 'summarize':
      return `CHAT MODE: Summarize
Structure the response as a clear study summary that includes:
- A clean summary of the provided topic, text, file, or conversation.
- Key points organized for quick review.
- Important definitions for terms the learner should know.
- Things to remember for retention or future use.
- Possible quiz questions the learner could use for practice.
- A suggested next step for learning or applying the material.`
    case 'image':
      return `CHAT MODE: Image
Do not handle image-generation mode through this text chat completion path. Tell the user that image mode must be routed to the image generation provider instead.`
    case 'ask':
    default:
      return ''
  }
}
