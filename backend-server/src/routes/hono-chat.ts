import { Hono } from 'hono';
import { honoAuthMiddleware } from '../middleware/hono-auth.js';
import {
  saveChatMessage,
  getChatHistory,
  createChatSession,
  listChatSessions,
  updateSessionTitle,
} from '../services/supabase.js';
import { generateResponse, Message } from '../services/mistral.js';

const router = new Hono();

// Create new chat session
router.post('/sessions', honoAuthMiddleware, async (c: any) => {
  try {
    const { title } = await c.req.json();
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }

    const session = await createChatSession(userId, title);
    return c.json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({ success: false, error: 'Failed to create chat session' }, 500);
  }
});

// Get all sessions for user
router.get('/sessions', honoAuthMiddleware, async (c: any) => {
  try {
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }

    const sessions = await listChatSessions(userId);
    return c.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return c.json({ success: false, error: 'Failed to fetch chat sessions' }, 500);
  }
});

// Get chat history for a session
router.get('/sessions/:sessionId', honoAuthMiddleware, async (c: any) => {
  try {
    const sessionId = c.req.param('sessionId');
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }

    const history = await getChatHistory(userId, sessionId);
    return c.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return c.json({ success: false, error: 'Failed to fetch chat history' }, 500);
  }
});

// Send message and get response
router.post('/messages', honoAuthMiddleware, async (c: any) => {
  try {
    const { sessionId, message, chatHistory } = await c.req.json();
    const user = c.get('user');
    const userId = user?.sub;

    if (!userId) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }
    if (!message || !sessionId) {
      return c.json({ success: false, error: 'Message and sessionId are required' }, 400);
    }

    const formattedHistory: Message[] = (chatHistory || []).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'tool',
      content: msg.content,
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
      ...(msg.name && { name: msg.name }),
    }));

    formattedHistory.push({ role: 'user', content: message });

    const aiResponse = await generateResponse(formattedHistory);

    await saveChatMessage(userId, sessionId, { role: 'user', content: message });
    await saveChatMessage(userId, sessionId, { role: 'assistant', content: aiResponse });

    if (!chatHistory || chatHistory.length === 0) {
      const title = message.substring(0, 50);
      await updateSessionTitle(sessionId, title);
    }

    return c.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ success: false, error: 'Failed to generate response' }, 500);
  }
});

export default router;
