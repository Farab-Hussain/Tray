type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Logs are stripped in production builds (__DEV__ === false), like Next.js. */
const canLog = () => __DEV__;

const write = (level: LogLevel, ...args: unknown[]) => {
  if (!canLog()) return;
  if (level === 'debug' || level === 'info') {
    console.log(...args);
    return;
  }
  if (level === 'warn') {
    console.warn(...args);
    return;
  }
  console.error(...args);
};

export const logger = {
  debug: (...args: unknown[]) => write('debug', ...args),
  info: (...args: unknown[]) => write('info', ...args),
  warn: (...args: unknown[]) => write('warn', ...args),
  error: (...args: unknown[]) => write('error', ...args),
};
