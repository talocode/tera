import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserLabProgress, getUserBadgeSummary, recordProgressEvent } from '@/lib/blockchain-lab/progress';
import { ProgressInputSchema } from '@/lib/blockchain-lab/schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getUserLabProgress(session.user.id);
    const badgeSummary = await getUserBadgeSummary(session.user.id);

    return NextResponse.json({ ...progress, ...badgeSummary });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ProgressInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error }, { status: 400 });
    }

    const { lessonSlug, status, score } = parsed.data;
    const progress = await recordProgressEvent(session.user.id, lessonSlug, status, score);

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}