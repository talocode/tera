import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({
        ok: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { url, title, summary, keyPoints } = body;

    if (!url || !title) {
      return NextResponse.json({
        ok: false,
        error: 'URL and title are required'
      }, { status: 400 });
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
      return NextResponse.json({
        ok: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      action: 'save-page',
      result: {
        id: data.id,
        url: data.url,
        title: data.title,
        savedAt: data.created_at
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'Save page failed'
    }, { status: 500 });
  }
}
