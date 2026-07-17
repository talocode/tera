import { supabaseServer } from '@/lib/supabase-server'

export type ActivationEvent =
  | 'onboarding_viewed'
  | 'onboarding_completed'
  | 'quickstart_clicked'
  | 'first_message_sent'
  | 'first_credit_used'

export async function trackActivationEvent(
  userId: string,
  eventType: ActivationEvent,
  metadata?: Record<string, any>
) {
  try {
    await supabaseServer.from('activation_events').insert({
      user_id: userId,
      event_type: eventType,
      metadata: metadata || {},
    })
  } catch (error) {
    console.error('[activation_track_failed]', { userId, eventType, error })
  }
}

export async function hasUserActivated(userId: string): Promise<boolean> {
  const { data } = await supabaseServer
    .from('activation_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'first_credit_used')
    .limit(1)
    .maybeSingle()

  return !!data
}

export async function getUserOnboardingStatus(userId: string): Promise<{
  completed: boolean
  choice: string | null
}> {
  const { data } = await supabaseServer
    .from('users')
    .select('onboarding_completed, onboarding_choice')
    .eq('id', userId)
    .maybeSingle()

  return {
    completed: data?.onboarding_completed || false,
    choice: data?.onboarding_choice || null,
  }
}

export async function completeOnboarding(userId: string, choice: string) {
  await supabaseServer
    .from('users')
    .update({ onboarding_completed: true, onboarding_choice: choice })
    .eq('id', userId)
}

export const QUICK_START_CATEGORIES = {
  learn: {
    label: 'Learn something',
    icon: '📚',
    description: 'Understand a concept step by step',
    prompts: [
      { title: 'Explain a concept', prompt: 'Explain quantum computing like I\'m 10 years old. Use simple analogies and give me 3 real-world examples.' },
      { title: 'Learn a skill', prompt: 'I want to learn Python programming. Give me a structured 7-day learning plan with daily exercises.' },
      { title: 'Deep dive topic', prompt: 'Give me a comprehensive overview of how neural networks work, from the math to practical applications.' },
    ],
  },
  write: {
    label: 'Write something',
    icon: '✍️',
    description: 'Draft, edit, or create content',
    prompts: [
      { title: 'Write an email', prompt: 'Write a professional email to my team about launching a new feature next week. Keep it concise and action-oriented.' },
      { title: 'Blog post draft', prompt: 'Write a 1000-word blog post about why AI tools are becoming essential for small businesses. Include practical tips.' },
      { title: 'Edit my text', prompt: 'I\'ll paste some text. Please improve the clarity, fix grammar, and make it more engaging while keeping my voice.' },
    ],
  },
  research: {
    label: 'Research a topic',
    icon: '🔍',
    description: 'Deep research with sources',
    prompts: [
      { title: 'Market research', prompt: 'Research the current state of the AI writing tools market in 2026. Who are the main players, what are the trends?' },
      { title: 'Compare options', prompt: 'Compare React vs Vue vs Svelte for a new web app in 2026. Give me pros, cons, and a recommendation.' },
      { title: 'Fact check', prompt: 'I have some claims I need to verify. Help me fact-check them using web search and provide sources.' },
    ],
  },
  code: {
    label: 'Write code',
    icon: '💻',
    description: 'Build, debug, or review code',
    prompts: [
      { title: 'Build something', prompt: 'Build a simple REST API with Node.js and Express that has CRUD operations for a todo list. Include error handling.' },
      { title: 'Debug an issue', prompt: 'I have a bug in my code. Let me paste it — please find the issue and explain how to fix it step by step.' },
      { title: 'Code review', prompt: 'Review my code for best practices, performance issues, and security vulnerabilities. Suggest improvements.' },
    ],
  },
  teaching: {
    label: 'Create teaching materials',
    icon: '🎓',
    description: 'Lessons, quizzes, study guides',
    prompts: [
      { title: 'Create a lesson plan', prompt: 'Create a detailed lesson plan for teaching photosynthesis to 10th graders. Include objectives, activities, and assessment.' },
      { title: 'Generate quiz questions', prompt: 'Generate 10 quiz questions about the American Civil War with multiple choice answers and explanations.' },
      { title: 'Study guide', prompt: 'Create a comprehensive study guide for a biology final exam covering cell biology, genetics, and evolution.' },
    ],
  },
  unsure: {
    label: 'Not sure yet',
    icon: '💡',
    description: 'Show me what you can do',
    prompts: [
      { title: 'Surprise me', prompt: 'Show me something interesting you can do. Give me a fun fact, a creative writing piece, and a code example — your choice!' },
      { title: 'Quick question', prompt: 'I have a quick question: what\'s the most useful thing you can help me with today?' },
      { title: 'Explore capabilities', prompt: 'Give me a tour of your capabilities. What are the top 5 things I should try first?' },
    ],
  },
} as const

export type QuickStartCategory = keyof typeof QUICK_START_CATEGORIES
