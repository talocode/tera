import { Hono } from 'hono';
import { honoAuthMiddleware } from '../middleware/hono-auth.js';
import { generateTool } from '../services/mistral.js';

const router = new Hono();

const TOOLS = [
  { id: 'concept-explainer', name: 'Concept Explainer', description: 'Break down any topic into simple, understandable chunks', category: 'learning' },
  { id: 'study-buddy', name: 'Study Buddy', description: 'Get homework help, practice problems, and exam prep', category: 'learning' },
  { id: 'lesson-plan-generator', name: 'Lesson Plan Generator', description: 'Create comprehensive lesson plans with pacing and engagement', category: 'teaching' },
  { id: 'worksheet-generator', name: 'Worksheet & Quiz Generator', description: 'Generate formative assessments with answer keys', category: 'teaching' },
  { id: 'rubric-builder', name: 'Rubric Builder', description: 'Build clear, scalable grading criteria', category: 'teaching' },
  { id: 'study-guide', name: 'Study Guide', description: 'Create personalized study guides with key concepts and practice', category: 'learning' },
];

router.get('/', honoAuthMiddleware, async (c: any) => {
  try {
    return c.json({ success: true, data: TOOLS });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch tools' }, 500);
  }
});

router.get('/:toolId', honoAuthMiddleware, async (c: any) => {
  try {
    const toolId = c.req.param('toolId');
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
      return c.json({ success: false, error: 'Tool not found' }, 404);
    }
    return c.json({ success: true, data: tool });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch tool' }, 500);
  }
});

router.post('/:toolId/process', honoAuthMiddleware, async (c: any) => {
  try {
    const toolId = c.req.param('toolId');
    const { input } = await c.req.json();
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
      return c.json({ success: false, error: 'Tool not found' }, 404);
    }

    const toolTypeMap: { [key: string]: string } = {
      'lesson-plan-generator': 'lessonPlan',
      'worksheet-generator': 'worksheet',
      'rubric-builder': 'rubric',
      'study-guide': 'studyGuide',
      'concept-explainer': 'conceptExplainer',
      'study-buddy': 'studyGuide',
    };

    const toolType = toolTypeMap[toolId] || toolId;
    const result = await generateTool(toolType, input);

    return c.json({
      success: true,
      data: {
        toolId,
        result,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error processing tool:', error);
    return c.json({ success: false, error: 'Failed to process tool' }, 500);
  }
});

export default router;
