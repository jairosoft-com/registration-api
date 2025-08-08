/**
 * Security-related constants for the application
 * Centralizes all security configuration values
 */

export const SECURITY = {
  PASSWORD: {
    SALT_ROUNDS: 10,
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  LOGIN: {
    MAX_ATTEMPTS: 5,
    LOCK_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
    LOCK_DURATION_HOURS: 2,
  },
  SESSION: {
    DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    DURATION_HOURS: 24,
  },
  TWO_FACTOR: {
    BACKUP_CODES_COUNT: 5,
    TOKEN_WINDOW: 2, // Number of time windows to check
  },
} as const;

// Type exports for better type safety
export type SecurityConfig = typeof SECURITY;
