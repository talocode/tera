import { auth } from '@/lib/auth';
import { browserApiOk, browserApiValidationError, browserApiError, browserApiUnauthorized } from '@/lib/browser-api/response';

type BrowserContextPayload = {
  source: string;
  url: string;
  title?: string;
  description?: string;
  text: string;
  headings?: string[];
  links?: Array<{ text: string; href: string }>;
  selectedText?: string;
  mode?: string;
};

const UNSAFE_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];
const PRIVATE_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/0\./,
];

function isValidUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') return { valid: false, error: 'URL is required' };
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, error: 'URL cannot be empty' };
  if (UNSAFE_PROTOCOLS.some((p) => trimmed.toLowerCase().startsWith(p))) {
    return { valid: false, error: 'Unsafe protocol blocked' };
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  try {
    const parsed = new URL(trimmed);
    if (PRIVATE_PATTERNS.some((p) => p.test(parsed.hostname))) {
      return { valid: false, error: 'Private or local URLs are not allowed' };
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  return { valid: true };
}

function containsSecrets(text: string): { hasSecrets: boolean; redactedCount: number } {
  const patterns = [
    /(?:api[_-]?key|apikey|secret|token|password|passwd|auth|credential)[=:]\s*['"]?[A-Za-z0-9_\-.]{16,}/gi,
    /(?:sk-[A-Za-z0-9]{20,})/g,
    /(?:ghp_[A-Za-z0-9]{36})/g,
    /(?:Bearer\s+[A-Za-z0-9\-._~+/]{20,})/gi,
    /(?:AKIA[0-9A-Z]{16})/g,
  ];
  let count = 0;
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) count += matches.length;
  }
  return { hasSecrets: count > 0, redactedCount: count };
}

const SENSITIVE_PAGE_PATTERNS = [
  /\/login/i, /\/signin/i, /\/auth\//i,
  /\/password/i, /\/reset/i, /\/recover/i,
  /\/checkout/i, /\/cart/i, /\/payment/i,
  /\/bank/i, /\/account\/?$/i,
];

export async function POST(request: Request) {
  try {
    let body: BrowserContextPayload;
    try {
      body = await request.json();
    } catch {
      return browserApiValidationError('Invalid JSON body');
    }

    if (!body || typeof body !== 'object') {
      return browserApiValidationError('Request body must be an object');
    }

    if (body.source !== 'tera-browser') {
      return browserApiValidationError('Invalid source. Must be "tera-browser"');
    }

    const urlValidation = isValidUrl(body.url);
    if (!urlValidation.valid) {
      return browserApiValidationError(urlValidation.error!);
    }

    if (!body.text || typeof body.text !== 'string') {
      return browserApiValidationError('Text content is required');
    }

    if (body.text.trim().length === 0) {
      return browserApiValidationError('Text content cannot be empty');
    }

    if (body.text.length > 100000) {
      return browserApiValidationError('Text content exceeds maximum length of 100000 characters');
    }

    if (body.selectedText && typeof body.selectedText !== 'string') {
      return browserApiValidationError('Selected text must be a string');
    }

    const session = await auth().catch(() => null);
    const isAuthenticated = !!session?.user;

    const secretCheck = containsSecrets(body.text);
    if (body.selectedText) {
      const selSecrets = containsSecrets(body.selectedText);
      if (selSecrets.hasSecrets) {
        return browserApiValidationError('Selected text contains potential secrets. Redact and retry.');
      }
    }

    const isSensitivePage = SENSITIVE_PAGE_PATTERNS.some((p) => p.test(body.url));

    const warnings: string[] = [];
    if (secretCheck.hasSecrets) {
      warnings.push(`Potential secrets detected in content (${secretCheck.redactedCount} pattern(s) found). These were not stored server-side.`);
    }
    if (isSensitivePage) {
      warnings.push('URL pattern suggests a sensitive page (login, payment, etc.). Content not stored server-side.');
    }
    if (!isAuthenticated) {
      warnings.push('Not authenticated. Content stored locally only.');
    }

    if (!isAuthenticated || secretCheck.hasSecrets || isSensitivePage) {
      return browserApiOk({
        action: 'context_capture',
        result: {
          accepted: false,
          storedLocally: true,
          storedServerSide: false,
          warnings,
          message: isSensitivePage
            ? 'Sensitive page detected. Content kept locally only.'
            : secretCheck.hasSecrets
              ? 'Secrets detected. Content kept locally only.'
              : 'Authentication required. Content kept locally only.',
        },
        context: {
          url: body.url,
          title: body.title || null,
          textLength: body.text.length,
          hasSelectedText: !!body.selectedText,
          mode: body.mode || 'general',
          warnings,
        },
      });
    }

    return browserApiOk({
      action: 'context_capture',
      result: {
        accepted: true,
        storedLocally: false,
        storedServerSide: true,
        warnings: [],
        message: 'Content captured successfully.',
      },
      context: {
        url: body.url,
        title: body.title || null,
        textLength: body.text.length,
        hasSelectedText: !!body.selectedText,
        mode: body.mode || 'general',
        warnings: [],
      },
    });
  } catch (error) {
    return browserApiError('Context capture failed');
  }
}
