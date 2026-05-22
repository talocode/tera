import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { explainBlockchainEvent } from '@/lib/ai/blockchain-lab-tutor';
import { ExplanationInputSchema } from '@/lib/blockchain-lab/schemas';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ExplanationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
    }

    const { eventType, eventData } = parsed.data;
    const explanation = await explainBlockchainEvent(eventType, eventData);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error generating explanation:', error);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}