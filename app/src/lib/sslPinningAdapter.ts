import axios, {
  AxiosAdapter,
  AxiosHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { fetch as sslFetch } from 'react-native-ssl-pinning';
import {
  formatPinsForSslLibrary,
  getSslPublicKeyPins,
  shouldPinUrl,
} from '../constants/sslPinning';

const buildRequestUrl = (config: InternalAxiosRequestConfig): string => {
  if (config.url && /^https?:\/\//i.test(config.url)) {
    return config.url;
  }
  return axios.getUri(config);
};

const normalizeHeaders = (
  headers: InternalAxiosRequestConfig['headers'],
): Record<string, string> => {
  if (!headers) return {};

  if (headers instanceof AxiosHeaders) {
    return headers.toJSON() as Record<string, string>;
  }

  const normalized: Record<string, string> = {};
  Object.entries(headers as Record<string, unknown>).forEach(([key, value]) => {
    if (value == null) return;
    normalized[key] = Array.isArray(value) ? value.join(', ') : String(value);
  });
  return normalized;
};

const sslMethod = (
  method?: string,
): 'GET' | 'POST' | 'PUT' | 'DELETE' => {
  const normalized = (method || 'GET').toUpperCase();
  if (normalized === 'DELETE') return 'DELETE';
  if (normalized === 'PUT') return 'PUT';
  if (normalized === 'POST') return 'POST';
  return 'GET';
};

const parseResponseData = async (
  response: Awaited<ReturnType<typeof sslFetch>>,
  responseType?: InternalAxiosRequestConfig['responseType'],
): Promise<unknown> => {
  if (responseType === 'arraybuffer' || responseType === 'blob') {
    const text = await response.text();
    return text;
  }

  if (responseType === 'text') {
    return response.text();
  }

  try {
    return await response.json();
  } catch {
    return await response.text();
  }
};

const createDefaultAdapter = (): AxiosAdapter => {
  const fallbackClient = axios.create();
  const adapter = fallbackClient.defaults.adapter;
  if (!adapter) {
    throw new Error('Unable to resolve default axios adapter');
  }
  return adapter;
};

let defaultAdapter: AxiosAdapter | null = null;

const getFallbackAdapter = (): AxiosAdapter => {
  if (!defaultAdapter) {
    defaultAdapter = createDefaultAdapter();
  }
  return defaultAdapter;
};

export const createSslPinningAdapter = (): AxiosAdapter => {
  return async (config): Promise<AxiosResponse> => {
    const url = buildRequestUrl(config);

    if (!shouldPinUrl(url)) {
      return getFallbackAdapter()(config);
    }

    const headers = normalizeHeaders(config.headers);
    if (config.data instanceof FormData && 'Content-Type' in headers) {
      delete headers['Content-Type'];
    }

    let body: string | FormData | undefined;
    if (config.data != null) {
      if (config.data instanceof FormData) {
        body = config.data;
      } else if (typeof config.data === 'string') {
        body = config.data;
      } else {
        body = JSON.stringify(config.data);
      }
    }

    try {
      const response = await sslFetch(url, {
        method: sslMethod(config.method),
        timeoutInterval: config.timeout || 25000,
        pkPinning: true,
        sslPinning: {
          certs: formatPinsForSslLibrary(getSslPublicKeyPins()),
        },
        headers,
        body,
      });

      const data = await parseResponseData(response, config.responseType);
      const status = response.status;

      if (status < 200 || status >= 300) {
        const error = new axios.AxiosError(
          `Request failed with status code ${status}`,
          axios.AxiosError.ERR_BAD_RESPONSE,
          config,
          null,
          {
            data,
            status,
            statusText: '',
            headers: response.headers || {},
            config,
          },
        );
        throw error;
      }

      return {
        data,
        status,
        statusText: '',
        headers: response.headers || {},
        config,
        request: null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error;
      }

      throw new axios.AxiosError(
        error instanceof Error ? error.message : 'SSL pinning request failed',
        axios.AxiosError.ERR_NETWORK,
        config,
      );
    }
  };
};
