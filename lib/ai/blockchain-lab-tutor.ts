import type { BlockchainExplanation } from '@/lib/blockchain-lab/schemas';
import {
  TRANSACTION_EXPLANATION_PROMPT,
  BLOCK_EXPLANATION_PROMPT,
  WALLET_EXPLANATION_PROMPT,
  GAS_EXPLANATION_PROMPT,
  FALLBACK_EXPLANATIONS,
} from '@/lib/blockchain-lab/prompts';

if (!process.env.MISTRAL_API_KEY) {
  console.warn('MISTRAL_API_KEY not set, blockchain lab explanations will use fallbacks');
}

async function callMistral(prompt: string): Promise<BlockchainExplanation | null> {
  if (!process.env.MISTRAL_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      console.error('Mistral API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      title: parsed.title || '',
      explanation: parsed.explanation || '',
      whyItMatters: parsed.whyItMatters || '',
      commonMistake: parsed.commonMistake || '',
      remember: parsed.remember || '',
      checkpointQuestion: parsed.checkpointQuestion || '',
      checkpointAnswer: parsed.checkpointAnswer || '',
    };
  } catch (error) {
    console.error('Error calling Mistral:', error);
    return null;
  }
}

export async function explainBlockchainEvent(
  eventType: 'transaction' | 'block' | 'wallet' | 'gas',
  eventData: Record<string, any>
): Promise<BlockchainExplanation> {
  let prompt = '';

  switch (eventType) {
    case 'transaction':
      prompt = TRANSACTION_EXPLANATION_PROMPT
        .replace('{token}', eventData.token || '')
        .replace('{amount}', String(eventData.amount || ''))
        .replace('{fromAddress}', eventData.fromAddress || '')
        .replace('{toAddress}', eventData.toAddress || '')
        .replace('{gasFee}', String(eventData.gasFee || ''))
        .replace('{status}', eventData.status || '');
      break;
    case 'block':
      prompt = BLOCK_EXPLANATION_PROMPT
        .replace('{blockNumber}', String(eventData.blockNumber || ''))
        .replace('{blockHash}', eventData.blockHash || '')
        .replace('{previousHash}', eventData.previousHash || 'none')
        .replace('{txCount}', String(eventData.txCount || ''));
      break;
    case 'wallet':
      prompt = WALLET_EXPLANATION_PROMPT
        .replace('{label}', eventData.label || '')
        .replace('{address}', eventData.address || '')
        .replace('{network}', eventData.network || '');
      break;
    case 'gas':
      prompt = GAS_EXPLANATION_PROMPT
        .replace('{token}', eventData.token || '')
        .replace('{amount}', String(eventData.amount || ''))
        .replace('{gasFee}', String(eventData.gasFee || ''));
      break;
  }

  const result = await callMistral(prompt);

  if (result) {
    return result;
  }

  const fallback = FALLBACK_EXPLANATIONS[eventType];
  if (fallback) {
    return fallback as BlockchainExplanation;
  }

  return {
    title: 'Event Explained',
    explanation: 'This is a simulated blockchain event for educational purposes.',
    whyItMatters: 'Understanding blockchain concepts helps you navigate the crypto space safely.',
    commonMistake: 'Always verify information with official sources.',
    remember: 'This is a learning simulation with fake values.',
    checkpointQuestion: 'What did you learn from this simulation?',
    checkpointAnswer: 'The key concept from this exercise',
  };
}