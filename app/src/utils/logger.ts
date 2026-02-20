type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const canLog = (level: LogLevel) => {
  if (level === 'error' || level === 'warn') return true;
  return __DEV__;
};

const write = (level: LogLevel, ...args: any[]) => {
  if (!canLog(level)) return;
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
  debug: (...args: any[]) => write('debug', ...args),
  info: (...args: any[]) => write('info', ...args),
  warn: (...args: any[]) => write('warn', ...args),
  error: (...args: any[]) => write('error', ...args),
};

