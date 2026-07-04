import { API_URL, FASTAPI_AI_URL, SSL_PINNING_ENABLED, SSL_PINNING_PUBLIC_KEY_HASHES } from '@env';

/**
 * Public key pins (SPKI SHA-256, base64) for tray-ecru.vercel.app / tray-ai-backend.vercel.app.
 *
 * Android: uses SSL_PINNING_PUBLIC_KEY_HASHES from .env (sha256/... via sslPinningAdapter).
 * iOS: react-native-ssl-pinning ignores JS pins — it loads .cer files from the app bundle
 *      (see ios/app/SSLPinning/*.cer). Regenerate both when the certificate chain rotates:
 *   ./scripts/extract-ssl-pins.sh tray-ecru.vercel.app
 */
export const DEFAULT_SSL_PUBLIC_KEY_PINS = [
  'ft9JFh9fyiSD0LI4vCAyVHDM1OKStfDBooxsWHHvngY=',
  'yDu9og255NN5GEf+Bwa9rTrqFQ0EydZ0r1FCh9TdAW4=',
  'hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=',
] as const;

const PINNED_HOST_SUFFIXES = ['.vercel.app'] as const;

const DEV_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /ngrok/i,
  /\.local$/i,
];

const parseEnvPins = (): string[] => {
  const raw = (SSL_PINNING_PUBLIC_KEY_HASHES || '').trim();
  if (!raw) return [...DEFAULT_SSL_PUBLIC_KEY_PINS];
  return raw
    .split(',')
    .map((pin) => pin.trim())
    .filter(Boolean);
};

export const getSslPublicKeyPins = (): string[] => parseEnvPins();

export const formatPinsForSslLibrary = (pins: string[]): string[] =>
  pins.map((pin) => (pin.startsWith('sha256/') ? pin : `sha256/${pin}`));

export const isSslPinningEnabled = (): boolean => {
  if (SSL_PINNING_ENABLED === 'false') return false;
  if (__DEV__) return false;
  return true;
};

export const isDevHostname = (hostname: string): boolean =>
  DEV_HOST_PATTERNS.some((pattern) => pattern.test(hostname));

export const isPinnedHostname = (hostname: string): boolean => {
  if (PINNED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return true;
  }

  const configuredHosts = [API_URL, FASTAPI_AI_URL]
    .filter(Boolean)
    .map((url) => {
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    })
    .filter(Boolean);

  return configuredHosts.includes(hostname);
};

export const shouldPinUrl = (url: string): boolean => {
  if (!isSslPinningEnabled()) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (isDevHostname(parsed.hostname)) return false;
    return isPinnedHostname(parsed.hostname);
  } catch {
    return false;
  }
};
