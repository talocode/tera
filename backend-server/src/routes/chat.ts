import express from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import {
  saveChatMessage,
  getChatHistory,
  createChatSession,
  listChatSessions,
  updateSessionTitle,
} from '../services/supabase.js';
import { generateResponse, Message } from '../services/mistral.js';

const router = express.Router();

// Create new chat session
router.post('/sessions', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { title } = req.body;
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const session = await createChatSession(userId, title);
    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, error: 'Failed to create chat session' });
  }
});

// Get all sessions for user
router.get('/sessions', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const sessions = await listChatSessions(userId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat sessions' });
  }
});

// Get chat history for a session
router.get('/sessions/:sessionId', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    const history = await getChatHistory(userId, sessionId);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  }
});

// Send message and get response
router.post('/messages', authMiddleware, async (req: AuthRequest, res: express.Response) => {
  try {
    const { sessionId, message, chatHistory } = req.body;
    const userId = req.user?.sub;

    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });
    if (!message || !sessionId) return res.status(400).json({ success: false, error: 'Message and sessionId are required' });

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

    res.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to generate response' });
  }
});

export default router;
