import { supabaseServer } from '@/lib/supabase-server';
import type { BlockchainLabProgress, BlockchainLabUserBadge } from './schemas';
import { BADGES, LESSONS } from './constants';

export async function recordProgressEvent(
  userId: string,
  lessonSlug: string,
  status: 'not_started' | 'in_progress' | 'completed',
  score?: number
): Promise<BlockchainLabProgress> {
  const { data, error } = await supabaseServer
    .from('blockchain_lab_progress')
    .upsert(
      {
        user_id: userId,
        lesson_slug: lessonSlug,
        status,
        score: score || 0,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_slug' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function completeLesson(
  userId: string,
  lessonSlug: string,
  score = 100
): Promise<BlockchainLabProgress> {
  return recordProgressEvent(userId, lessonSlug, 'completed', score);
}

export async function awardBadgeIfEligible(
  userId: string,
  badgeSlug: string
): Promise<boolean> {
  const { data: existing } = await supabaseServer
    .from('blockchain_lab_user_badges')
    .select('*')
    .eq('user_id', userId)
    .eq('badge_slug', badgeSlug)
    .single();

  if (existing) return false;

  const { error } = await supabaseServer
    .from('blockchain_lab_user_badges')
    .insert({
      user_id: userId,
      badge_slug: badgeSlug,
    });

  if (error && error.code !== 'PGRST116') {
    console.error('Error awarding badge:', error);
    return false;
  }

  return true;
}

export async function getUserLabProgress(
  userId: string
): Promise<{
  progress: BlockchainLabProgress[];
  badges: BlockchainLabUserBadge[];
  completedLessons: number;
  totalLessons: number;
}> {
  const [progressResult, badgesResult] = await Promise.all([
    supabaseServer
      .from('blockchain_lab_progress')
      .select('*')
      .eq('user_id', userId),
    supabaseServer
      .from('blockchain_lab_user_badges')
      .select('*')
      .eq('user_id', userId),
  ]);

  const progress = progressResult.data || [];
  const badges = badgesResult.data || [];
  const completedLessons = progress.filter((p) => p.status === 'completed').length;

  const { data: lessons } = await supabaseServer
    .from('blockchain_lab_lessons')
    .select('slug')
    .eq('is_published', true);

  return {
    progress,
    badges,
    completedLessons,
    totalLessons: lessons?.length || 4,
  };
}

export async function getUserBadgeSummary(
  userId: string
): Promise<{
  earned: string[];
  available: string[];
}> {
  const { data: userBadges } = await supabaseServer
    .from('blockchain_lab_user_badges')
    .select('badge_slug')
    .eq('user_id', userId);

  const { data: allBadges } = await supabaseServer
    .from('blockchain_lab_badges')
    .select('slug');

  const earned = userBadges?.map((b) => b.badge_slug) || [];
  const available = allBadges?.map((b) => b.slug).filter((b) => !earned.includes(b)) || [];

  return { earned, available };
}

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awardedBadges: string[] = [];

  const { data: wallets } = await supabaseServer
    .from('blockchain_lab_wallets')
    .select('id')
    .eq('user_id', userId);

  if (wallets && wallets.length > 0) {
    const awarded = await awardBadgeIfEligible(userId, BADGES.FIRST_WALLET);
    if (awarded) awardedBadges.push(BADGES.FIRST_WALLET);
  }

  const { data: transactions } = await supabaseServer
    .from('blockchain_lab_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'confirmed');

  if (transactions && transactions.length > 0) {
    const awarded = await awardBadgeIfEligible(userId, BADGES.FIRST_TRANSFER);
    if (awarded) awardedBadges.push(BADGES.FIRST_TRANSFER);
  }

  return awardedBadges;
}