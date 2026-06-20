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
    const { url, title, text, question, mode } = body;

    if (!url || !text || !question) {
      return NextResponse.json({
        ok: false,
        error: 'URL, text, and question are required'
      }, { status: 400 });
    }

    // Truncate long text
    const truncatedText = text.substring(0, 10000);

    // In v0.1, we return a simple response
    // Full AI integration would call Tera's LLM here
    const answer = `Based on the page content, here is a response to your question: "${question}"\n\nThe page contains information about: ${truncatedText.substring(0, 100)}...`;

    return NextResponse.json({
      ok: true,
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
    return NextResponse.json({
      ok: false,
      error: 'Ask failed'
    }, { status: 500 });
  }
}
