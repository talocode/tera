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

    const { url, title, text, mode } = body;

    if (!url || !text) {
      return browserApiValidationError('URL and text are required');
    }

    // Truncate long text
    const truncatedText = text.substring(0, 10000);

    // In v0.1, we return a simple explanation structure
    const explanation = `This page covers: ${truncatedText.substring(0, 150)}...\n\nKey concepts are explained in the content above.`;

    return browserApiOk({
      action: 'explain',
      result: {
        explanation: explanation,
        concepts: [],
        prerequisites: []
      },
      usage: {
        creditsUsed: 1,
        remainingCredits: 99
      }
    });
  } catch (error) {
    return browserApiError('Explain failed');
  }
}
