import { auth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
import { browserApiOk, browserApiUnauthorized, browserApiValidationError, browserApiError } from '@/lib/browser-api/response';
import { validatePageContextInput, normalizePageContext, redactSecrets } from '@/lib/browser-api/web-context';
import { createHash } from 'crypto';

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

    if (body.approved !== true) {
      return browserApiValidationError('Page saving requires explicit user approval (approved: true)');
    }

    const validation = validatePageContextInput(body);
    if (!validation.valid) {
      return browserApiValidationError(validation.error!);
    }

    const redacted = redactSecrets(body.text);
    const context = normalizePageContext({ ...body, text: redacted.text });

    const { data, error } = await supabaseServer
      .from('browser_saved_pages')
      .insert({
        user_id: session.user.id,
        url: context.url,
        title: context.title,
        summary: context.excerpt,
        key_points: [],
        source_text_hash: context.textHash
      })
      .select()
      .single();

    if (error) {
      return browserApiError('Save page failed');
    }

    return browserApiOk({
      action: 'save-page',
      result: {
        id: data.id,
        url: data.url,
        title: data.title,
        savedAt: data.created_at
      },
      context: {
        sourceType: context.sourceType,
        mode: context.mode,
        textLength: context.textLength,
        truncated: context.truncated,
        textHash: context.textHash,
        redactedSecrets: redacted.redactedCount
      }
    });
  } catch (error) {
    return browserApiError('Save page failed');
  }
}
