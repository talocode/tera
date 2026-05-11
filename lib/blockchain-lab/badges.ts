import { BADGES } from './constants';

export const BADGE_INFO: Record<string, { title: string; description: string; icon: string }> = {
  [BADGES.FIRST_WALLET]: {
    title: 'First Wallet',
    description: 'Created your first simulated wallet',
    icon: 'wallet',
  },
  [BADGES.FIRST_TRANSFER]: {
    title: 'First Transfer',
    description: 'Completed your first transaction',
    icon: 'send',
  },
  [BADGES.BLOCK_EXPLORER]: {
    title: 'Block Explorer',
    description: 'Used the block explorer',
    icon: 'search',
  },
  [BADGES.STABLECOIN_BASICS]: {
    title: 'Stablecoin Basics',
    description: 'Learned about stablecoins',
    icon: 'coin',
  },
  [BADGES.BLOCKCHAIN_BEGINNER]: {
    title: 'Blockchain Beginner',
    description: 'Completed all beginner lessons',
    icon: 'graduation',
  },
};

export function getBadgeInfo(slug: string) {
  return BADGE_INFO[slug] || { title: slug, description: '', icon: 'badge' };
}

export function isBadgeEarned(badgeSlug: string, earnedBadges: string[]): boolean {
  return earnedBadges.includes(badgeSlug);
}

export function getEarnedBadgeDetails(earnedSlugs: string[]) {
  return earnedSlugs.map((slug) => ({
    slug,
    ...getBadgeInfo(slug),
  }));
}