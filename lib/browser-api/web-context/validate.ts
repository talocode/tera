import type { PageContextInput } from './types';

const PRIVATE_IP_PATTERNS = [
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/,
  /^https?:\/\/127\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
];

const INTERNAL_HOSTS = ['localhost', '0.0.0.0', 'metadata.google.internal'];

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }

  if (trimmed.startsWith('file://')) {
    return { valid: false, error: 'file:// URLs are not allowed' };
  }

  try {
    const parsed = new URL(trimmed);
    
    if (parsed.hostname === 'localhost' || parsed.hostname === '0.0.0.0') {
      return { valid: false, error: 'localhost URLs are not allowed' };
    }

    if (INTERNAL_HOSTS.includes(parsed.hostname)) {
      return { valid: false, error: 'Internal host URLs are not allowed' };
    }

    if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
      return { valid: false, error: 'Loopback addresses are not allowed' };
    }

    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { valid: false, error: 'Private IP addresses are not allowed' };
      }
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  return { valid: true };
}

export function validatePageContextInput(input: PageContextInput): { valid: boolean; error?: string } {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Input is required' };
  }

  if (!input.url || typeof input.url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const urlValidation = validateUrl(input.url);
  if (!urlValidation.valid) {
    return { valid: false, error: urlValidation.error };
  }

  if (!input.text || typeof input.text !== 'string') {
    return { valid: false, error: 'Text content is required' };
  }

  if (input.text.trim().length === 0) {
    return { valid: false, error: 'Text content cannot be empty' };
  }

  if (input.title !== undefined && typeof input.title !== 'string') {
    return { valid: false, error: 'Title must be a string' };
  }

  if (input.question !== undefined && typeof input.question !== 'string') {
    return { valid: false, error: 'Question must be a string' };
  }

  const validSourceTypes = ['page', 'selection', 'article', 'document'];
  if (input.sourceType && !validSourceTypes.includes(input.sourceType)) {
    return { valid: false, error: `Invalid sourceType. Must be one of: ${validSourceTypes.join(', ')}` };
  }

  const validModes = ['general', 'student', 'teacher', 'researcher'];
  if (input.mode && !validModes.includes(input.mode)) {
    return { valid: false, error: `Invalid mode. Must be one of: ${validModes.join(', ')}` };
  }

  return { valid: true };
}
