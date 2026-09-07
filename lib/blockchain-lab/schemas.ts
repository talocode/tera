import { z } from 'zod';

export const ProgressInputSchema = z.object({
  lessonSlug: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  score: z.number().optional(),
});

export type ProgressInput = z.infer<typeof ProgressInputSchema>;

export interface BlockchainLabProgress {
  id: string;
  userId: string;
  lessonSlug: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number;
  completedAt?: string;
  updatedAt: string;
}

export interface BlockchainLabBadge {
  slug: string;
  title: string;
  description: string;
  icon?: string;
}

export interface BlockchainLabUserBadge {
  id: string;
  userId: string;
  badgeSlug: string;
  earnedAt: string;
}