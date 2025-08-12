import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import logger from '../utils/logger';

// API keys are loaded from environment variables for security.
// In production, these would be stored securely (database, env vars, etc.)
const collectedKeys = [
  process.env.API_KEY,
  process.env.CLASS_REGISTRATION_API_KEY,
  process.env.TEST_API_KEY,
].filter(Boolean) as string[];

// In mock/test mode, provide a safe default key so E2E can authenticate
// without requiring env setup. This only applies when DB is skipped or NODE_ENV=test
if (
  collectedKeys.length === 0 &&
  (process.env.SKIP_DB_CONNECTION === 'true' || process.env.NODE_ENV === 'test')
)
  collectedKeys.push('test-api-key-123');

const VALID_API_KEYS = new Set(collectedKeys);

/**
 * Middleware to validate API key authentication
 * Expects X-API-Key header with a valid API key
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;

    // Check if API key is provided
    if (!apiKey) {
      throw new ApiError(401, 'API key is required. Please provide X-API-Key header');
    }

    // Validate API key
    if (!VALID_API_KEYS.has(apiKey)) {
      logger.warn(
        {
          providedKey: apiKey.substring(0, 8) + '...',
          ip: req.ip,
          path: req.path,
        },
        'Invalid API key attempt'
      );

      throw new ApiError(401, 'Invalid API key');
    }

    // Log successful authentication
    logger.debug(
      {
        path: req.path,
        method: req.method,
      },
      'API key authentication successful'
    );

    // Continue to next middleware
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error',
      });
    }
  }
};
