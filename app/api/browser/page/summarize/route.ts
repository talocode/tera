import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

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
    const { url, title, text, mode } = body;

    if (!url || !text) {
      return NextResponse.json({
        ok: false,
        error: 'URL and text are required'
      }, { status: 400 });
    }

    // Truncate long text
    const truncatedText = text.substring(0, 10000);

    // In v0.1, we return a simple summary structure
    // Full AI integration would call Tera's LLM here
    const summary = truncatedText.substring(0, 200) + '...';

    return NextResponse.json({
      ok: true,
      action: 'summarize',
      result: {
        summary: summary,
        keyPoints: [],
        suggestedQuestions: []
      },
      usage: {
        creditsUsed: 1,
        remainingCredits: 99
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'Summarize failed'
    }, { status: 500 });
  }
}
