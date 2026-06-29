import { WEB_BASE_URL } from '@env';

const DEFAULT_WEB_BASE_URL = 'https://tray-dashboard-eight.vercel.app';

const normalizeBaseUrl = (url?: string): string => {
  const trimmed = (url || DEFAULT_WEB_BASE_URL).trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

export const getWebBaseUrl = (): string => normalizeBaseUrl(WEB_BASE_URL);

export const LEGAL_URLS = {
  privacyPolicy: `${getWebBaseUrl()}/privacy-policy`,
  termsOfService: `${getWebBaseUrl()}/terms`,
};
