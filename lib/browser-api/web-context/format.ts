import type { PageContext } from './types';

function extractSentences(text: string, count: number): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const sentences: string[] = [];
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  let match;

  while ((match = sentenceRegex.exec(cleaned)) !== null && sentences.length < count) {
    const sentence = match[0].trim();
    if (sentence.length > 10) {
      sentences.push(sentence);
    }
  }

  return sentences;
}

function extractBullets(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 20)
    .slice(0, 5);
}

function findKeywordMatches(text: string, keywords: string[]): string[] {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }

  return matches;
}

export function formatSummary(ctx: PageContext): { summary: string; keyPoints: string[] } {
  const sentences = extractSentences(ctx.text, 3);
  const summary = sentences.length > 0
    ? sentences.join(' ')
    : ctx.excerpt;

  const keyPoints = extractBullets(ctx.text);

  return {
    summary,
    keyPoints,
  };
}

export function formatAnswer(ctx: PageContext, question: string): { answer: string; confidence: string } {
  const questionKeywords = question.split(/\s+/).filter(w => w.length > 3);
  const matchedKeywords = findKeywordMatches(ctx.text, questionKeywords);
  
  const firstSentences = extractSentences(ctx.text, 2);
  const answer = matchedKeywords.length > 0
    ? `Based on the page content, here is a response to your question: "${question}"\n\n${firstSentences.join(' ')}`
    : `Based on the page content, here is a response to your question: "${question}"\n\nThe page covers: ${ctx.excerpt}`;

  const confidence = matchedKeywords.length > 0 ? 'medium' : 'low';

  return { answer, confidence };
}

export function formatExplanation(ctx: PageContext): { explanation: string; concepts: string[] } {
  const sentences = extractSentences(ctx.text, 4);
  const explanation = sentences.length > 0
    ? `This page covers: ${sentences[0]}\n\nKey points:\n${sentences.slice(1).map(s => `- ${s}`).join('\n')}`
    : `This page covers: ${ctx.excerpt}`;

  const concepts = extractBullets(ctx.text)
    .map(bullet => bullet.replace(/\.$/, ''));

  return { explanation, concepts };
}
