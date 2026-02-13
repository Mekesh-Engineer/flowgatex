// =============================================================================
// LOGGER UTILITY — Wrapper around console with environment-aware log levels
// =============================================================================
// Usage:
//   import { logger } from '@/lib/logger';
//   logger.log('message');    // Only in development
//   logger.warn('message');   // Only in development
//   logger.error('message');  // Always logged
// =============================================================================

const isDev = import.meta.env.DEV;

export const logger = {
  /** Informational log — only in development */
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Warning — only in development */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },

  /** Error — always logged (production and development) */
  error: (...args: unknown[]) => {
    console.error(...args);
  },

  /** Debug — only in development */
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },

  /** Group logs — only in development */
  group: (label: string) => {
    if (isDev) console.group(label);
  },

  /** End group — only in development */
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
} as const;

export default logger;
