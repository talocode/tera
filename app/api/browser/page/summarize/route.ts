import { auth } from '@/lib/auth';
import { browserApiOk, browserApiUnauthorized, browserApiValidationError, browserApiError } from '@/lib/browser-api/response';
import { validatePageContextInput, normalizePageContext, redactSecrets, formatSummary } from '@/lib/browser-api/web-context';

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

    const validation = validatePageContextInput(body);
    if (!validation.valid) {
      return browserApiValidationError(validation.error!);
    }

    const redacted = redactSecrets(body.text);
    const context = normalizePageContext({ ...body, text: redacted.text });
    const { summary, keyPoints } = formatSummary(context);

    return browserApiOk({
      action: 'summarize',
      result: {
        summary,
        keyPoints,
        suggestedQuestions: []
      },
      context: {
        sourceType: context.sourceType,
        mode: context.mode,
        textLength: context.textLength,
        truncated: context.truncated,
        textHash: context.textHash,
        redactedSecrets: redacted.redactedCount
      },
      usage: {
        creditsUsed: 1,
        remainingCredits: 99
      }
    });
  } catch (error) {
    return browserApiError('Summarize failed');
  }
}
