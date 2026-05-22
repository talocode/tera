import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserLabProgress, getUserBadgeSummary } from '@/lib/blockchain-lab/progress';
import { getBadgeInfo } from '@/lib/blockchain-lab/badges';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getUserLabProgress(session.user.id);
    const badgeSummary = await getUserBadgeSummary(session.user.id);

    const earnedBadges = badgeSummary.earned.map((slug) => ({
      slug,
      ...getBadgeInfo(slug),
    }));

    const certificate = {
      userId: session.user.id,
      earnedBadges,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      earnedAt: progress.badges.map((b: any) => b.earned_at).filter(Boolean),
      status: progress.completedLessons >= 4 ? 'blockchain-beginner' : 'in-progress',
    };

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ error: 'Failed to fetch certificate' }, { status: 500 });
  }
}