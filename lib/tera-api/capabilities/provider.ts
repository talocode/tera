const MOCK_ENABLED = process.env.TERA_API_ALLOW_MOCK_PROVIDER === 'true'

export interface ProviderConfig {
  provider: string
  model: string
}

export function getProviderConfig(): ProviderConfig {
  return {
    provider: process.env.TERA_API_PROVIDER || 'mistral',
    model: process.env.TERA_API_MODEL || 'mistral-small-latest',
  }
}

export function isMockAllowed(): boolean {
  return MOCK_ENABLED
}

function buildSystemPrompt(systemInstruction: string): string {
  return `You are the Tera API — an AI capability service that provides writing and coding assistance.

CORE RULES:
- Answer only what is asked. Do not add generic disclaimers.
- Return structured, precise responses.
- Do not mention specific AI model providers (OpenAI, Anthropic, Mistral, etc.) in your output.
- The product is Tera API. You serve capabilities, not model access.

${systemInstruction}`
}

export async function callProvider(
  systemInstruction: string,
  userContent: string,
): Promise<string> {
  const config = getProviderConfig()
  const mockOverride = process.env.TERA_API_PROVIDER_OVERRIDE

  if (mockOverride === 'mock' || (config.provider === 'mock' && MOCK_ENABLED)) {
    return mockCompletion(userContent)
  }

  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) {
    if (MOCK_ENABLED) {
      return mockCompletion(userContent)
    }
    throw new Error('No AI provider configured. Set MISTRAL_API_KEY or TERA_API_ALLOW_MOCK_PROVIDER=true for development.')
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(systemInstruction) },
          { role: 'user', content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown')
      throw new Error(`Provider returned status ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (typeof content === 'string') {
      return content.trim()
    }

    if (Array.isArray(content)) {
      return content.map((c: any) => (typeof c === 'string' ? c : c.text || '')).join('').trim()
    }

    throw new Error('Provider returned empty response')
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Provider returned')) {
      throw err
    }
    throw new Error('Provider request failed.')
  }
}

function mockCompletion(_input: string): string {
  return `This is a mock response from the Tera API development provider.

The requested capability has been processed.

Note: This is a simulated response because TERA_API_ALLOW_MOCK_PROVIDER=true. In production, this will use a real AI provider.`
}
