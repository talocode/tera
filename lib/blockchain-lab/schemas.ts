import { z } from 'zod';

export const TokenSymbolSchema = z.enum(['USDC', 'ETH', 'TERA']);

export const CreateWalletInputSchema = z.object({
  label: z.string().min(1).max(50),
  createDemo: z.boolean().optional().default(false),
});

export type CreateWalletInput = z.infer<typeof CreateWalletInputSchema>;

export const CreateTransactionInputSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid().optional(),
  createDemoReceiver: z.boolean().optional().default(false),
  amount: z.number().positive(),
  token: TokenSymbolSchema,
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;

export const ExplorerQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum(['wallet', 'transaction', 'block']).optional(),
});

export type ExplorerQuery = z.infer<typeof ExplorerQuerySchema>;

export const ProgressInputSchema = z.object({
  lessonSlug: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  score: z.number().optional(),
});

export type ProgressInput = z.infer<typeof ProgressInputSchema>;

export const ExplanationInputSchema = z.object({
  eventType: z.enum(['transaction', 'block', 'wallet', 'gas']),
  eventData: z.record(z.any()),
});

export type ExplanationInput = z.infer<typeof ExplanationInputSchema>;

export interface SimulatedWallet {
  id: string;
  userId: string;
  label: string;
  address: string;
  network: string;
  createdAt: string;
}

export interface SimulatedBalance {
  id: string;
  walletId: string;
  tokenSymbol: string;
  amount: number;
  updatedAt: string;
}

export interface SimulatedTransaction {
  id: string;
  userId: string;
  hash: string;
  fromWalletId: string;
  toWalletId: string;
  tokenSymbol: string;
  amount: number;
  gasFee: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockId?: string;
  failureReason?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface SimulatedBlock {
  id: string;
  userId: string;
  blockNumber: number;
  blockHash: string;
  previousBlockHash: string | null;
  createdAt: string;
}

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

export interface BlockchainExplanation {
  title: string;
  explanation: string;
  whyItMatters: string;
  commonMistake: string;
  remember: string;
  checkpointQuestion: string;
  checkpointAnswer: string;
}