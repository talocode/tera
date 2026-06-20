import { auth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';
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

    const { url, title, summary, keyPoints } = body;

    if (!url || !title) {
      return browserApiValidationError('URL and title are required');
    }

    // Save to browser_saved_pages table
    const { data, error } = await supabaseServer
      .from('browser_saved_pages')
      .insert({
        user_id: session.user.id,
        url: url,
        title: title,
        summary: summary || '',
        key_points: keyPoints || [],
        source_text_hash: crypto.createHash('sha256').update(url).digest('hex')
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
      }
    });
  } catch (error) {
    return browserApiError('Save page failed');
  }
}
