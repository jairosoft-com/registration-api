import { Request, Response, NextFunction } from 'express';
import redisClient from '@/database/redis';
import logger from '@common/utils/logger';

/**
 * Redis Caching Middleware
 *
 * This middleware provides caching functionality for GET requests.
 * It caches the response body and serves it for subsequent requests
 * until the TTL expires.
 *
 * @param ttl - Time to live in seconds (default: 60 seconds)
 * @returns Express middleware function
 */
export const cacheMiddleware = (ttl: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on URL and query parameters
    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Check if data exists in cache
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        // Cache hit - return cached data
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cached));
      }

      // Cache miss - proceed with request and cache the response
      logger.debug(`Cache miss for key: ${cacheKey}`);

      // Store the original res.json method
      const originalJson = res.json;

      // Override res.json to capture the response
      res.json = function (data: any) {
        // Cache the response data
        redisClient.setEx(cacheKey, ttl, JSON.stringify(data)).catch((error) => {
          logger.error({ err: error }, 'Failed to cache response');
        });

        // Call the original res.json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error({ err: error }, 'Cache middleware error');
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Cache Invalidation Middleware
 *
 * This middleware invalidates cache entries for specific patterns.
 * Useful for POST, PUT, DELETE operations that modify data.
 *
 * @param pattern - Cache key pattern to invalidate (default: 'cache:*')
 * @returns Express middleware function
 */
export const invalidateCache = (pattern: string = 'cache:*') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Only invalidate cache for non-GET requests
    if (req.method === 'GET') {
      return next();
    }

    try {
      // Find and delete all keys matching the pattern
      const keys = await redisClient.keys(pattern);

      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.debug(`Invalidated ${keys.length} cache entries`);
      }

      next();
    } catch (error) {
      logger.error({ err: error }, 'Cache invalidation error');
      // Continue without cache invalidation on error
      next();
    }
  };
};

/**
 * Cache Health Check
 *
 * Checks if Redis cache is available and responding.
 *
 * @returns Promise<boolean> - true if cache is healthy
 */
export const checkCacheHealth = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Cache health check failed');
    return false;
  }
};
