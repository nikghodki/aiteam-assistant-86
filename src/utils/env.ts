
/**
 * Environment configuration utilities
 * 
 * This module provides access to environment variables with fallbacks
 */

// API base URL with fallback
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.sre-assistant.com';

// Environment name
export const NODE_ENV = import.meta.env.NODE_ENV || 'development';

// Check if we're in production
export const isProd = NODE_ENV === 'production';

// Check if we're in development
export const isDev = NODE_ENV === 'development';

console.log('Environment initialization:', {
  API_BASE_URL,
  NODE_ENV,
  isProd,
  isDev
});
