import axios from 'axios';
import { sanitizeUserMessage } from './sanitizeUserMessage';
import { logger } from './logger';

/** Expected 402 when a role entry fee is required — handled in UI with Pay Now. */
export const isPaymentRequiredError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 402;

export const getPaymentRequiredMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Pay the entry fee to continue.';
  }
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return sanitizeUserMessage(data?.message || data?.error || 'Pay the entry fee to continue.');
};

/**
 * User-safe message — never exposes AxiosError, status codes, or ECONNABORTED.
 */
export const getUserFriendlyErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (isPaymentRequiredError(error)) {
    return getPaymentRequiredMessage(error);
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    const serverMessage = data?.message || data?.error;
    if (serverMessage) {
      return sanitizeUserMessage(serverMessage);
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'The request took too long. Check your connection and try again.';
    }
    if (!error.response) {
      return 'Check your internet connection and try again.';
    }
    return fallback;
  }

  if (error instanceof Error && error.message) {
    const cleaned = sanitizeUserMessage(error.message);
    if (cleaned && !/axios|request failed|status code/i.test(cleaned)) {
      return cleaned;
    }
  }

  return fallback;
};

/** Dev-only — avoids LogBox stacking from console.error. */
export const logApiError = (context: string, error: unknown): void => {
  if (!__DEV__) return;
  if (axios.isAxiosError(error)) {
    logger.debug(
      `[${context}]`,
      error.config?.url,
      error.response?.status ?? 'no-response',
      error.code || error.message,
    );
    return;
  }
  logger.debug(`[${context}]`, error);
};
