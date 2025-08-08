import { createClient, RedisClientType } from 'redis';
import config from '@/config';
import logger from '@common/utils/logger';

// Global variable to store the Redis client (singleton pattern)
const globalForRedis = global as unknown as {
  redisClient: RedisClientType | undefined;
};

/**
 * Create standardized Redis client configuration
 * Ensures consistent configuration across all environments
 */
function createRedisClientConfig() {
  return {
    socket: {
      host: config.redis.host,
      port: config.redis.port,
      reconnectStrategy: (retries: number) => {
        // Exponential backoff with max 3 seconds
        const delay = Math.min(retries * 50, 3000);
        logger.info({ retries, delay }, 'Redis reconnecting');
        return delay;
      },
      connectTimeout: 10000, // 10 seconds
      commandTimeout: 5000, // 5 seconds
    },
    // Retry commands if connection is lost
    commandsQueueMaxLength: 100,
  };
}

let redisClient: RedisClientType;

// Implement singleton pattern for Redis client with standardized config
if (process.env.NODE_ENV === 'production') {
  // Production: create new client with standardized config
  redisClient = createClient(createRedisClientConfig());
} else {
  // Development/test: use singleton pattern with standardized config
  if (!globalForRedis.redisClient) {
    globalForRedis.redisClient = createClient(createRedisClientConfig());
  }
  redisClient = globalForRedis.redisClient;
}

// Redis client event handlers
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis client error');
});

redisClient.on('end', () => {
  logger.warn('Redis client connection ended');
});

redisClient.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

/**
 * Connect to Redis and verify connection
 */
export const connectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) {
    logger.info('Redis already connected');
    return;
  }

  try {
    await redisClient.connect();
    logger.info('Successfully connected to Redis');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw error;
  }
};

/**
 * Check Redis connection health
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.ping();
      return true;
    }
    return false;
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return false;
  }
};

/**
 * Gracefully close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    }
  } catch (error) {
    logger.error({ error }, 'Error closing Redis connection');
  }
};

export default redisClient;
