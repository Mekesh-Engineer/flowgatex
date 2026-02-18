import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getAuthInstance } from './firebase';
import { useAuthStore } from '@/store/zustand/stores';
import { logger } from '@/lib/logger';

/**
 * API Error Codes as per API Documentation
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * API Error Response Structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * API Success Response Structure
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Rate Limit Headers
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const user = getAuthInstance().currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error('Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and rate limits
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract rate limit information
    const rateLimitInfo = extractRateLimitInfo(response);
    if (rateLimitInfo && import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      logger.debug('Rate Limit Info:', rateLimitInfo);
    }
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config;

    // Handle 401 - token expired
    if (error.response?.status === 401 && originalRequest) {
      try {
        const user = getAuthInstance().currentUser;
        if (user) {
          // Force refresh the token
          const newToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // No user — clear auth state and reject (let UI handle redirect)
          useAuthStore.getState().clearUser();
        }
      } catch (refreshError) {
        // Token refresh failed — clear auth state and reject
        useAuthStore.getState().clearUser();
        return Promise.reject(refreshError);
      }
    }

    // Handle 429 - Rate limit exceeded
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const errorData = error.response.data;
      
      if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
        logger.warn('Rate limit exceeded. Retry after:', retryAfter);
      }

      // You can implement retry logic here if needed
      return Promise.reject({
        code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
        message: errorData?.error?.message || 'Too many requests. Please try again later.',
        retryAfter: retryAfter ? parseInt(retryAfter) : 60,
      });
    }

    // Handle other error codes
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Log errors in development
      if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
        logger.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          code: errorData.error?.code,
          message: errorData.error?.message,
          details: errorData.error?.details,
        });
      }

      return Promise.reject(errorData.error);
    }

    // Network or timeout errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        code: ApiErrorCode.SERVER_ERROR,
        message: 'Request timeout. Please try again.',
      });
    }

    if (!error.response) {
      return Promise.reject({
        code: ApiErrorCode.SERVICE_UNAVAILABLE,
        message: 'Network error. Please check your internet connection.',
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Extract rate limit information from response headers
 */
function extractRateLimitInfo(response: AxiosResponse): RateLimitInfo | null {
  const limit = response.headers['x-ratelimit-limit'];
  const remaining = response.headers['x-ratelimit-remaining'];
  const reset = response.headers['x-ratelimit-reset'];

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit),
      remaining: parseInt(remaining),
      reset: parseInt(reset),
    };
  }

  return null;
}

/**
 * Helper function to handle API errors
 */
export function handleApiError(error: any): string {
  if (typeof error === 'object' && error.message) {
    return error.message;
  }

  if (error?.code) {
    switch (error.code) {
      case ApiErrorCode.UNAUTHORIZED:
        return 'You are not authorized. Please log in again.';
      case ApiErrorCode.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      case ApiErrorCode.NOT_FOUND:
        return 'The requested resource was not found.';
      case ApiErrorCode.VALIDATION_ERROR:
        return error.message || 'Invalid data provided.';
      case ApiErrorCode.DUPLICATE_ENTRY:
        return 'This resource already exists.';
      case ApiErrorCode.PAYMENT_FAILED:
        return 'Payment processing failed. Please try again.';
      case ApiErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Too many requests. Please wait a moment and try again.';
      case ApiErrorCode.SERVER_ERROR:
        return 'An unexpected error occurred. Please try again later.';
      case ApiErrorCode.SERVICE_UNAVAILABLE:
        return 'Service is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

export default api;
