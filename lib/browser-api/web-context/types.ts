export type PageContextSourceType = 'page' | 'selection' | 'article' | 'document';
export type PageContextMode = 'general' | 'student' | 'teacher' | 'researcher';

export interface PageContext {
  url: string;
  title: string;
  text: string;
  excerpt: string;
  sourceType: PageContextSourceType;
  mode: PageContextMode;
  textLength: number;
  truncated: boolean;
  textHash: string;
  createdAt: string;
}

export interface PageContextInput {
  url: string;
  title?: string;
  text: string;
  question?: string;
  sourceType?: PageContextSourceType;
  mode?: PageContextMode;
  approved?: boolean;
}
