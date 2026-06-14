import { AuthSession, Conversation, Message, SavedItem, TeraMode, User } from '@/types/domain';

const now = new Date();

export const mockUser: User = {
  id: 'user_tera_foundation',
  name: 'Tera Learner',
  email: 'learner@tera.ai',
  plan: 'free',
};

const seedConversations: Conversation[] = [
  {
    id: 'conv_learning_systems',
    title: 'Understanding spaced repetition',
    mode: 'learn',
    summary: 'A clear breakdown of active recall, intervals, and review design.',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
    isSaved: true,
    messages: [
      {
        id: 'msg_1',
        conversationId: 'conv_learning_systems',
        role: 'user',
        content: 'Explain spaced repetition like I am building a study plan.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
        status: 'sent',
      },
      {
        id: 'msg_2',
        conversationId: 'conv_learning_systems',
        role: 'assistant',
        content:
          'Spaced repetition works by reviewing an idea right before you are likely to forget it. For a study plan, treat each concept as a card: learn it once, test yourself soon, then widen the review interval when recall is strong.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 18).toISOString(),
        status: 'sent',
      },
    ],
  },
  {
    id: 'conv_research_brief',
    title: 'Research plan for climate adaptation',
    mode: 'research',
    summary: 'Questions, source types, and a structure for a focused brief.',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
    isSaved: false,
    messages: [
      {
        id: 'msg_3',
        conversationId: 'conv_research_brief',
        role: 'user',
        content: 'Help me research climate adaptation for coastal cities.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
        status: 'sent',
      },
    ],
  },
  {
    id: 'conv_build_learning_app',
    title: 'Build a quiz flow for biology',
    mode: 'build',
    summary: 'A practical outline for turning notes into a quiz experience.',
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    isSaved: true,
    messages: [
      {
        id: 'msg_4',
        conversationId: 'conv_build_learning_app',
        role: 'assistant',
        content:
          'Start with learning goals, extract question candidates, then generate feedback for each wrong answer so the quiz teaches rather than only scores.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
        status: 'sent',
      },
    ],
  },
];

const conversations: Conversation[] = seedConversations.map((conversation) => ({
  ...conversation,
  messages: conversation.messages.map((message) => ({ ...message })),
}));

function delay<T>(value: T, ms = 280): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function normalizePrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, ' ');
}

function summarizePrompt(prompt: string) {
  const normalized = normalizePrompt(prompt);
  return normalized.length > 54 ? `${normalized.slice(0, 51)}...` : normalized;
}

function buildAssistantReply(mode: TeraMode, prompt: string) {
  const opening = {
    learn: 'Here is the simplest useful model:',
    research: 'Here is a research-ready way to frame it:',
    build: 'Here is a practical build path:',
  }[mode];

  return `${opening} ${prompt.trim()} can be broken into the core idea, the evidence or constraints, and the next action. In the real backend, this response will come from TeraAI with streaming, citations, and memory-aware context.`;
}

function createMessage(params: {
  conversationId: string;
  role: Message['role'];
  content: string;
  status?: Message['status'];
}) {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversationId: params.conversationId,
    role: params.role,
    content: params.content,
    createdAt: new Date().toISOString(),
    status: params.status ?? 'sent',
  } satisfies Message;
}

function createConversationId() {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function cloneConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({ ...message })),
  };
}

function deriveSavedItems(source: Conversation[]): SavedItem[] {
  return source
    .filter((conversation) => conversation.isSaved)
    .map((conversation) => ({
      id: `saved_${conversation.id}`,
      conversationId: conversation.id,
      title: conversation.title,
      excerpt: conversation.summary,
      mode: conversation.mode,
      savedAt: conversation.updatedAt,
    }));
}

function upsertConversation(conversation: Conversation) {
  const index = conversations.findIndex((item) => item.id === conversation.id);
  if (index >= 0) {
    conversations[index] = conversation;
    return;
  }

  conversations.unshift(conversation);
}

function appendMessage(conversationId: string, message: Message) {
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return;

  conversation.messages = [...conversation.messages, message];
  conversation.updatedAt = message.createdAt;
  if (message.role === 'assistant') {
    conversation.summary = message.content.slice(0, 120);
  }
}

export const mockApi = {
  async signIn(email: string): Promise<AuthSession> {
    return delay({
      token: 'mock_tera_mobile_token',
      user: {
        ...mockUser,
        email,
      },
    });
  },
  async signUp(name: string, email: string): Promise<AuthSession> {
    return delay({
      token: 'mock_tera_mobile_token',
      user: {
        ...mockUser,
        name,
        email,
      },
    });
  },
  async requestPasswordReset(): Promise<{ ok: true }> {
    return delay({ ok: true });
  },
  async createConversation(mode: TeraMode, prompt: string): Promise<Conversation> {
    const normalizedPrompt = normalizePrompt(prompt);
    const conversationId = createConversationId();
    const userMessage = createMessage({
      conversationId,
      role: 'user',
      content: normalizedPrompt,
    });
    const assistantMessage = createMessage({
      conversationId,
      role: 'assistant',
      content: buildAssistantReply(mode, normalizedPrompt),
    });

    const conversation: Conversation = {
      id: conversationId,
      title: summarizePrompt(normalizedPrompt) || 'New conversation',
      mode,
      summary: assistantMessage.content.slice(0, 120),
      updatedAt: assistantMessage.createdAt,
      isSaved: false,
      messages: [userMessage, assistantMessage],
    };

    upsertConversation(conversation);
    return delay(cloneConversation(conversation), 520);
  },
  async getConversations(): Promise<Conversation[]> {
    return delay(conversations.map(cloneConversation));
  },
  async getConversation(id: string): Promise<Conversation | null> {
    const conversation = conversations.find((item) => item.id === id);
    return delay(conversation ? cloneConversation(conversation) : null);
  },
  async getSavedItems(): Promise<SavedItem[]> {
    return delay(deriveSavedItems(conversations));
  },
  async sendMessage(conversationId: string, mode: TeraMode, prompt: string) {
    const userMessage = createMessage({
      conversationId,
      role: 'user',
      content: normalizePrompt(prompt),
    });
    const assistantMessage = createMessage({
      conversationId,
      role: 'assistant',
      content: buildAssistantReply(mode, prompt),
    });

    appendMessage(conversationId, userMessage);
    appendMessage(conversationId, assistantMessage);

    return delay(assistantMessage, 520);
  },
};
