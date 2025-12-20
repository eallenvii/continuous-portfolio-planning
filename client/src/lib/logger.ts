type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  verbose: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

const currentLevel: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'verbose';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level: string, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `${timestamp} | ${level.toUpperCase().padEnd(7)} | ${context} | ${message}`;
}

export const logger = {
  verbose: (context: string, message: string, data?: unknown) => {
    if (shouldLog('verbose')) {
      console.debug(formatMessage('verbose', context, message), data ?? '');
    }
  },
  debug: (context: string, message: string, data?: unknown) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', context, message), data ?? '');
    }
  },
  info: (context: string, message: string, data?: unknown) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', context, message), data ?? '');
    }
  },
  warn: (context: string, message: string, data?: unknown) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', context, message), data ?? '');
    }
  },
  error: (context: string, message: string, error?: unknown) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', context, message), error ?? '');
    }
  },
};

export function logApiRequest(method: string, url: string, body?: unknown) {
  logger.verbose('api', `REQUEST: ${method} ${url}`, body);
}

export function logApiResponse(method: string, url: string, status: number, data?: unknown) {
  logger.verbose('api', `RESPONSE: ${method} ${url} -> ${status}`, data);
}

export function logApiError(method: string, url: string, error: unknown) {
  logger.error('api', `ERROR: ${method} ${url}`, error);
}
