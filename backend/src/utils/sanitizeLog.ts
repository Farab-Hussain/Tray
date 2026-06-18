/** Redact sensitive fields before logging request bodies or payloads. */
const SENSITIVE_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'idToken',
  'otp',
  'fcmToken',
  'voipToken',
  'token',
  'resetSessionId',
  'authorization',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'verificationToken',
]);

export const isDevLog = (): boolean => process.env.NODE_ENV !== 'production';

export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForLog);
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEYS.has(key) ? '***' : sanitizeForLog(nested);
    }
    return output;
  }

  return value;
}

/** Mask push/auth tokens in logs — never log full token values. */
export function maskToken(token: string | undefined | null): string {
  if (!token || typeof token !== 'string') {
    return '***';
  }
  if (token.length <= 8) {
    return '***';
  }
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function devLog(...args: unknown[]): void {
  if (isDevLog()) {
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]): void {
  if (isDevLog()) {
    console.warn(...args);
  }
}

export function devError(...args: unknown[]): void {
  if (isDevLog()) {
    console.error(...args);
  }
}
