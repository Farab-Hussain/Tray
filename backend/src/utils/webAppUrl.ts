/**
 * Base URL for the Next.js web app (verify-email page, Stripe return URLs, etc.).
 * Must NOT be the Express API host (e.g. tray-ecru.vercel.app).
 */
const KNOWN_API_ONLY_HOSTS = ['tray-ecru.vercel.app', 'www.tray-ecru.vercel.app'];

const DEFAULT_WEB_APP_URL = 'https://tray-dashboard-eight.vercel.app';

export const getWebAppUrl = (): string => {
  const configured = (
    process.env.WEB_APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  if (!configured) {
    return DEFAULT_WEB_APP_URL;
  }

  try {
    const host = new URL(configured).hostname;
    if (KNOWN_API_ONLY_HOSTS.includes(host) && !process.env.WEB_APP_URL) {
      console.warn(
        `[webAppUrl] FRONTEND_URL points at API host (${host}). Using WEB_APP_URL or default dashboard URL for web pages.`
      );
      return (process.env.WEB_APP_URL || DEFAULT_WEB_APP_URL).replace(/\/+$/, '');
    }
  } catch {
    return DEFAULT_WEB_APP_URL;
  }

  return configured;
};
