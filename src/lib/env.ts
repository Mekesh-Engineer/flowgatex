import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Environment variables schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Firebase Configuration
  VITE_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  VITE_FIREBASE_APP_ID: z.string().min(1, 'Firebase app ID is required'),
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),

  // Payment Gateways
  VITE_RAZORPAY_KEY_ID: z.string().optional(),
  VITE_CASHFREE_APP_ID: z.string().optional(),

  // Google Services
  VITE_GOOGLE_ANALYTICS_ID: z.string().optional(),

  // Application Configuration
  VITE_APP_NAME: z.string().default('FlowGateX'),
  VITE_APP_URL: z.string().url().optional(),
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_ENV: z.enum(['development', 'production', 'staging']).default('development'),

  // Feature Flags
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_ENABLE_PWA: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  VITE_ENABLE_CHATBOT: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_ENABLE_DEBUG: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_VERCEL_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // Error Tracking
  VITE_SENTRY_DSN: z.string().optional(),

  // IoT
  VITE_IOT_WS_ENDPOINT: z.string().optional(),
});

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables on app initialization
 * Logs warnings for missing variables but does not crash the app in production.
 */
export function validateEnv(): Env | null {
  try {
    const env = envSchema.parse(import.meta.env);
    logger.log('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      // In production, log the error but don't crash — Firebase init will handle missing keys
      if (import.meta.env.PROD) {
        logger.warn('⚠️ Environment validation failed. Some features may be unavailable.');
        return null;
      }
      throw new Error('Environment validation failed. Please check your .env.local file.');
    }
    throw error;
  }
}

/**
 * Get a typed environment variable
 * @param key - Environment variable key
 * @returns The environment variable value
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return import.meta.env[key] as Env[K];
}

/**
 * Check if the app is in production mode
 */
export const isProduction = (): boolean => {
  return import.meta.env.VITE_ENV === 'production' || import.meta.env.PROD;
};

/**
 * Check if the app is in development mode
 */
export const isDevelopment = (): boolean => {
  return import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV;
};

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
};

/**
 * Check if debug mode is enabled
 */
export const isDebugEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_DEBUG === 'true';
};

/**
 * Check if chatbot is enabled
 */
export const isChatbotEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_CHATBOT === 'true';
};

// Validate environment variables on module load
if (typeof window !== 'undefined') {
  validateEnv();
}
