import { fetch as sslFetch } from 'react-native-ssl-pinning';
import {
  formatPinsForSslLibrary,
  getSslPublicKeyPins,
  shouldPinUrl,
} from '../constants/sslPinning';

export type SslPinningRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData | object | null;
  timeout?: number;
  signal?: AbortSignal;
};

const normalizeHeaders = (
  headers?: Record<string, string | string[] | undefined>,
): Record<string, string> => {
  if (!headers) return {};
  const normalized: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (value == null) return;
    normalized[key] = Array.isArray(value) ? value.join(', ') : String(value);
  });
  return normalized;
};

const parseSslResponseBody = async (
  response: Awaited<ReturnType<typeof sslFetch>>,
): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
};

const sslMethod = (method?: string): 'GET' | 'POST' | 'PUT' | 'DELETE' => {
  const normalized = (method || 'GET').toUpperCase();
  if (normalized === 'DELETE') return 'DELETE';
  if (normalized === 'PUT') return 'PUT';
  if (normalized === 'POST') return 'POST';
  return 'GET';
};

export async function sslPinningFetch(
  url: string,
  init: SslPinningRequestInit = {},
): Promise<Response> {
  if (!shouldPinUrl(url)) {
    return fetch(url, init as RequestInit);
  }

  const timeoutMs = init.timeout ?? 25000;
  let abortListener: (() => void) | undefined;

  if (init.signal) {
    if (init.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
  }

  const sslPromise = sslFetch(url, {
    method: sslMethod(init.method),
    timeoutInterval: timeoutMs,
    pkPinning: true,
    sslPinning: {
      certs: formatPinsForSslLibrary(getSslPublicKeyPins()),
    },
    headers: normalizeHeaders(init.headers),
    body: init.body ?? undefined,
  });

  const response = init.signal
    ? await Promise.race([
        sslPromise,
        new Promise<never>((_, reject) => {
          abortListener = () =>
            reject(new DOMException('Aborted', 'AbortError'));
          init.signal?.addEventListener('abort', abortListener, { once: true });
        }),
      ])
    : await sslPromise;

  if (abortListener && init.signal) {
    init.signal.removeEventListener('abort', abortListener);
  }

  const body = await parseSslResponseBody(response);

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    headers: new Headers(response.headers || {}),
    json: async () => body,
    text: async () =>
      typeof body === 'string' ? body : JSON.stringify(body ?? ''),
  } as Response;
}
