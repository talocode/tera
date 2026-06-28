const REDACTION_PATTERNS = [
  { name: 'bearer', regex: /(?:Bearer\s+[A-Za-z0-9\-._~+/]+=*)/gi },
  { name: 'api_key', regex: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]?[A-Za-z0-9\-._]{20,}['"]?/gi },
  { name: 'password', regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi },
  { name: 'private_key', regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi },
  { name: 'token', regex: /(?:token|access_token|auth_token|jwt)\s*[:=]\s*['"]?[A-Za-z0-9\-._]{20,}['"]?/gi },
  { name: 'secret', regex: /(?:secret|client_secret)\s*[:=]\s*['"]?[A-Za-z0-9\-._]{20,}['"]?/gi },
];

interface RedactResult {
  text: string;
  redactedCount: number;
}

export function redactSecrets(text: string): RedactResult {
  let redactedText = text;
  let totalRedacted = 0;

  for (const pattern of REDACTION_PATTERNS) {
    const matches = redactedText.match(pattern.regex);
    if (matches) {
      totalRedacted += matches.length;
      redactedText = redactedText.replace(pattern.regex, '[REDACTED]');
    }
  }

  return {
    text: redactedText,
    redactedCount: totalRedacted,
  };
}
