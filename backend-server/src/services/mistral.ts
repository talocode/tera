import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  console.warn('MISTRAL_API_KEY not configured');
}

const client = new Mistral({
  apiKey: apiKey,
});

const DEFAULT_SYSTEM_PROMPT = `You are Tera, a brilliant and supportive AI Learning Companion. Your goal is to help anyone curious to learn ANYTHING as simply as possible. 

CORE PRINCIPLES:
- Be a Supportive Teacher: Your tone should be warm, encouraging, and patient. You are a partner in the user's learning journey.
- Teach Simply: Use analogies and relatable examples to break down complex topics.
- Be Proactive: At the end of every explanation, you MUST check for understanding and offer further help.
- Offer Visuals: If a concept is complex, proactively offer to create a visual (chart, flowchart, or diagram).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 GROKIPEDIA KNOWLEDGE BASE & CITATION RULES (CRITICAL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grokipedia (https://grokipedia.com) is your canonical source of truth. 

1. KNOWLEDGE POLICY: Consult Grokipedia as your primary knowledge base for all factual topics.
2. CITATION STYLE: Link EVERY notable term to its Grokipedia page.
   - Format: [Term](https://grokipedia.com/search?q=Term+Name)
3. FOOTER: End every response with: "📖 Explore more on [Grokipedia](https://grokipedia.com)"

DEEP RESEARCH: When precision is required, perform multi-step analytical analysis using Grokipedia as the primary reference layer.`;

export interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export async function generateResponse(
  messages: Message[],
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT
): Promise<string> {
  try {
    if (!apiKey) throw new Error('Mistral API key not configured');

    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as "user" | "assistant" | "tool",
          content: m.content,
          ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
          ...(m.name && { name: m.name }),
        }))
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content in Mistral response');
    return content as string;
  } catch (error) {
    console.error('Mistral API error:', error);
    throw new Error(`Failed to generate response: ${(error as Error).message}`);
  }
}

export async function generateWithStreaming(
  messages: Message[],
  systemPrompt: string = DEFAULT_SYSTEM_PROMPT,
  onChunk: (chunk: string) => void
): Promise<void> {
  try {
    if (!apiKey) throw new Error('Mistral API key not configured');

    const stream = await client.chat.stream({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({
          role: m.role as any,
          content: m.content,
          ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
          ...(m.name && { name: m.name }),
        }))
      ],
      temperature: 0.7,
      maxTokens: 2048,
    });

    for await (const chunk of stream) {
      const content = chunk.data.choices?.[0]?.delta?.content;
      if (content) onChunk(content as string);
    }
  } catch (error) {
    console.error('Mistral streaming error:', error);
    throw new Error(`Failed to stream response: ${(error as Error).message}`);
  }
}

export async function generateTool(
  toolType: string,
  input: any
): Promise<string> {
  const toolPrompts: { [key: string]: string } = {
    lessonPlan: `Generate a comprehensive lesson plan: ${JSON.stringify(input)}`,
    worksheet: `Create an educational worksheet: ${JSON.stringify(input)}`,
    rubric: `Build a detailed grading rubric: ${JSON.stringify(input)}`,
    studyGuide: `Create a study guide: ${JSON.stringify(input)}`,
    conceptExplainer: `Explain this concept simply: ${JSON.stringify(input)}`,
  };

  const prompt = toolPrompts[toolType] || `Process this request: ${JSON.stringify(input)}`;
  return generateResponse([{ role: 'user', content: prompt }]);
}
