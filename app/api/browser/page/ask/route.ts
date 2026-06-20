import { auth } from '@/lib/auth';
import { browserApiOk, browserApiUnauthorized, browserApiValidationError, browserApiError } from '@/lib/browser-api/response';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return browserApiUnauthorized();
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return browserApiValidationError('Invalid JSON');
    }

    const { url, title, text, question, mode } = body;

    if (!url || !text || !question) {
      return browserApiValidationError('URL, text, and question are required');
    }

    // Truncate long text
    const truncatedText = text.substring(0, 10000);

    // In v0.1, we return a simple response
    const answer = `Based on the page content, here is a response to your question: "${question}"\n\nThe page contains information about: ${truncatedText.substring(0, 100)}...`;

    return browserApiOk({
      action: 'ask',
      result: {
        answer: answer,
        sources: [],
        suggestedFollowUp: []
      },
      usage: {
        creditsUsed: 1,
        remainingCredits: 99
      }
    });
  } catch (error) {
    return browserApiError('Ask failed');
  }
}
