import { Request, Response } from 'express';
import { connectMongo } from '@/database/mongo';
import logger from '@common/utils/logger';
import config from '@/config';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: {
      mongodb: HealthCheck;
      postgres: HealthCheck;
      redis: HealthCheck;
    };
    memory: HealthCheck;
    disk: HealthCheck;
  };
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, degraded]
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-15T10:30:00Z"
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         mongodb:
 *                           $ref: '#/components/schemas/HealthCheck'
 *                         postgres:
 *                           $ref: '#/components/schemas/HealthCheck'
 *                         redis:
 *                           $ref: '#/components/schemas/HealthCheck'
 *                     memory:
 *                       $ref: '#/components/schemas/HealthCheck'
 *                     disk:
 *                       $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: API is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 message:
 *                   type: string
 *                   example: "One or more health checks failed"
 */
export const getHealth = async (_req: Request, res: Response) => {
  try {
    // Check database connections
    const dbChecks = await checkDatabases();

    // Check system resources
    const systemChecks = checkSystemResources();

    // Determine overall health status
    const allChecks = [
      dbChecks.mongodb,
      dbChecks.postgres,
      dbChecks.redis,
      systemChecks.memory,
      systemChecks.disk,
    ];

    const unhealthyChecks = allChecks.filter((check) => check.status === 'unhealthy');
    // Note: HealthCheck interface only supports 'healthy' | 'unhealthy', not 'degraded'
    // const degradedChecks = allChecks.filter((check) => check.status === 'degraded');

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (unhealthyChecks.length > 0) {
      overallStatus = 'unhealthy';
    }
    // Removed degraded status check as it's not supported by HealthCheck interface

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: '1.0.0',
      checks: {
        database: dbChecks,
        memory: systemChecks.memory,
        disk: systemChecks.disk,
      },
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error({ error }, 'Health check failed');

    res.status(503).json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe endpoint
 *     description: Returns whether the application is ready to receive traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-15T10:30:00Z"
 *       503:
 *         description: Application is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not ready"
 *                 message:
 *                   type: string
 *                   example: "Application is still starting up"
 */
export const getReadiness = async (_req: Request, res: Response) => {
  try {
    // Check if all critical dependencies are available
    const dbChecks = await checkDatabases();
    const criticalChecks = [dbChecks.mongodb, dbChecks.postgres, dbChecks.redis];

    const isReady = criticalChecks.every((check) => check.status === 'healthy');

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        message: 'Critical dependencies are not available',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error({ error }, 'Readiness check failed');

    res.status(503).json({
      status: 'not ready',
      message: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe endpoint
 *     description: Returns whether the application is alive and running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-15T10:30:00Z"
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 */
export const getLiveness = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * Check database connections
 */
const checkDatabases = async (): Promise<{
  mongodb: HealthCheck;
  postgres: HealthCheck;
  redis: HealthCheck;
}> => {
  const checks = {
    mongodb: await checkMongoDB(),
    postgres: await checkPostgreSQL(),
    redis: await checkRedis(),
  };

  return checks;
};

/**
 * Check MongoDB connection
 */
const checkMongoDB = async (): Promise<HealthCheck> => {
  const startTime = Date.now();

  try {
    // Try to connect to MongoDB
    await connectMongo();

    // Import mongoose to check connection state
    const { default: mongoose } = await import('mongoose');

    // Check if the connection is in the connected state before any operations
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState !== 1) {
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      const currentState = states[mongoose.connection.readyState] || 'unknown';
      throw new Error(
        `MongoDB connection is not in a connected state. Current state: ${currentState} (${mongoose.connection.readyState})`
      );
    }

    // After verifying connection state, check if database object exists
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database connection not established despite connected state');
    }

    // Get admin database for ping - this should be safe after connection checks
    const adminDb = mongoose.connection.db.admin();
    if (!adminDb) {
      throw new Error('MongoDB admin database not available despite valid connection');
    }

    // Ping the database to verify it's responsive
    await adminDb.ping();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'MongoDB connection is healthy',
      responseTime,
      details: {
        database: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown',
        port: mongoose.connection.port || 27017,
        readyState: mongoose.connection.readyState,
        readyStateText: 'connected',
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'unhealthy',
      message: 'MongoDB connection failed',
      responseTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

/**
 * Check PostgreSQL connection
 */
const checkPostgreSQL = async (): Promise<HealthCheck> => {
  const startTime = Date.now();

  try {
    // Try to connect to PostgreSQL
    const { Pool } = await import('pg');
    const pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'PostgreSQL connection is healthy',
      responseTime,
      details: {
        host: config.postgres.host,
        port: config.postgres.port,
        database: config.postgres.database,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'unhealthy',
      message: 'PostgreSQL connection failed',
      responseTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

/**
 * Check Redis connection
 */
const checkRedis = async (): Promise<HealthCheck> => {
  const startTime = Date.now();

  try {
    // Try to connect to Redis
    const { createClient } = await import('redis');
    const client = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
    });

    await client.connect();
    await client.ping();
    await client.disconnect();

    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Redis connection is healthy',
      responseTime,
      details: {
        host: config.redis.host,
        port: config.redis.port,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      status: 'unhealthy',
      message: 'Redis connection failed',
      responseTime,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

/**
 * Check system resources
 */
const checkSystemResources = (): {
  memory: HealthCheck;
  disk: HealthCheck;
} => {
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  const memoryCheck: HealthCheck = {
    status: memoryUsagePercent > 90 ? 'unhealthy' : 'healthy',
    message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
    details: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
    },
  };

  // For disk check, we'll just return a basic check since we can't easily check disk space in Node.js
  const diskCheck: HealthCheck = {
    status: 'healthy',
    message: 'Disk space check not implemented',
    details: {
      note: 'Disk space monitoring requires additional libraries or system calls',
    },
  };

  return {
    memory: memoryCheck,
    disk: diskCheck,
  };
};
