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

    // In v0.1, we return a simple explanation structure
    const explanation = `This page covers: ${truncatedText.substring(0, 150)}...\n\nKey concepts are explained in the content above.`;

    return NextResponse.json({
      ok: true,
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
    return NextResponse.json({
      ok: false,
      error: 'Explain failed'
    }, { status: 500 });
  }
}
