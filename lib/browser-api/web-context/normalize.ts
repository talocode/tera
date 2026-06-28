import { createHash } from 'crypto';
import type { PageContext, PageContextInput } from './types';

const MAX_INPUT_LENGTH = 40000;
const MAX_OUTPUT_LENGTH = 20000;

function extractExcerpt(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  const sentenceEndRegex = /[.!?]+(?:\s|$)/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = sentenceEndRegex.exec(cleaned)) !== null && sentences.length < 3) {
    const sentence = cleaned.substring(lastIndex, match.index + match[0].length).trim();
    if (sentence.length > 0) {
      sentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }

  if (sentences.length === 0 && cleaned.length > 0) {
    sentences.push(cleaned.substring(0, 200));
  }

  return sentences.join(' ');
}

function collapseNewlines(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function computeTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function normalizePageContext(input: PageContextInput): PageContext {
  const truncatedInput = input.text.length > MAX_INPUT_LENGTH;
  const text = truncatedInput
    ? input.text.substring(0, MAX_INPUT_LENGTH)
    : input.text;

  const cleanedText = collapseNewlines(text);
  const truncatedOutput = cleanedText.length > MAX_OUTPUT_LENGTH;
  const finalText = truncatedOutput
    ? cleanedText.substring(0, MAX_OUTPUT_LENGTH)
    : cleanedText;

  const title = input.title
    ? input.title.replace(/\s+/g, ' ').trim()
    : 'Untitled';

  return {
    url: input.url.trim(),
    title: title || 'Untitled',
    text: finalText,
    excerpt: extractExcerpt(finalText),
    sourceType: input.sourceType || 'page',
    mode: input.mode || 'general',
    textLength: finalText.length,
    truncated: truncatedInput || truncatedOutput,
    textHash: computeTextHash(finalText),
    createdAt: new Date().toISOString(),
  };
}
