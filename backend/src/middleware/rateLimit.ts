import rateLimit from 'express-rate-limit';

const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
const isTestEnv = nodeEnv === 'test';
const isDevEnv =
  nodeEnv === 'development' ||
  process.env.DISABLE_RATE_LIMIT === 'true';

/**
 * General auth endpoint limiter — login, OTP, password reset, register, verify-email.
 * 10 requests per 15 minutes per IP (disabled in test env).
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 10_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
});

/**
 * Global API limiter — 300 requests per 15 minutes per IP.
 * Skipped in test env. Health checks are excluded in app.ts.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv || isDevEnv ? 100_000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
});
