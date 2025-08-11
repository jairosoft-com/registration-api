import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../common/utils/ApiError';
import logger from '../common/utils/logger';

// In production, these would be stored securely (database, env vars, etc.)
const VALID_API_KEYS = new Set(
  ['test-api-key-123', process.env.API_KEY, process.env.CLASS_REGISTRATION_API_KEY].filter(Boolean)
);

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
