import type { CorsOptions } from 'cors';

/** Deployed services (Vercel). */
export const PRODUCTION_ORIGINS = [
  'https://tray-ecru.vercel.app',
  'https://tray-ai-backend.vercel.app',
  'https://tray-dashboard-eight.vercel.app',
  'https://tray-app.com',
  'https://www.tray-app.com',
];

/** Local dev — web dashboard, Metro, local backends. */
export const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:8000',
  'http://localhost:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:19006',
  'capacitor://localhost',
  'ionic://localhost',
];

const LOCAL_NETWORK_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

const EXPO_ORIGIN = /^exp:\/\//;

const NGROK_ORIGIN =
  /^https?:\/\/[a-z0-9-]+\.(ngrok-free\.dev|ngrok\.io|ngrok\.app)(:\d+)?$/i;

const parseExtraOrigins = (): string[] =>
  (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

export const getAllowedOrigins = (): string[] => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const extras = parseExtraOrigins();

  const base =
    nodeEnv === 'production'
      ? [...PRODUCTION_ORIGINS]
      : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];

  return [...new Set([...base, ...extras])];
};

const isLocalDevOrigin = (origin: string): boolean => {
  if (LOCAL_NETWORK_ORIGIN.test(origin) || EXPO_ORIGIN.test(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== 'production' || process.env.CORS_ALLOW_LOCALHOST === 'true') {
    return NGROK_ORIGIN.test(origin);
  }

  return false;
};

export const isOriginAllowed = (origin: string | undefined): boolean => {
  // Native mobile apps, curl, Postman, and server-to-server calls omit Origin.
  if (!origin) {
    return true;
  }

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    return true;
  }

  return isLocalDevOrigin(origin);
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    if (process.env.NODE_ENV !== 'test') {
      console.warn(`⚠️ [CORS] Blocked origin: ${origin}`);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning',
    'Cache-Control',
    'Pragma',
    'X-Requested-With',
    'Origin',
    'Accept',
  ],
  exposedHeaders: ['Content-Length', 'X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
  preflightContinue: false,
};
