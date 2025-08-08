import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '@/config';
import logger from '@common/utils/logger';
import { connectPostgres, closePostgres } from '@/database/postgres';
import { connectMongo, closeMongo } from '@/database/mongo';
import { connectRedis, closeRedis } from '@/database/redis';
import { errorMiddleware } from '@common/middleware/error.middleware';
import { ApiError } from '@common/utils/ApiError';
import { componentRegistry } from '@common/core/ComponentRegistry';
import { join } from 'path';
import { setupSwagger } from '@/config/swagger';
import {
  requestLogger,
  responseLogger,
  errorLogger,
  performanceMonitor,
} from '@common/middleware/logging.middleware';

// Phase 5: Real-time Features
import { socketService } from '@/services/socket.service';
import { eventService } from '@/services/event.service';

// Phase 5: Advanced Security
import { oauthService } from '@/services/oauth.service';

// Phase 5: Microservices Architecture
import { serviceDiscoveryService } from '@/services/service-discovery.service';
import { apiGatewayService } from '@/services/api-gateway.service';

const app: Express = express();

// Security Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));

// General rate limiting for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again later.',
  },
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many authentication attempts, please try again later.',
  },
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// Logging and monitoring middleware
app.use(requestLogger);
app.use(responseLogger);
app.use(performanceMonitor);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               message: "API is healthy"
 *               timestamp: "2025-01-15T10:30:00Z"
 *               uptime: 12345.67
 *               environment: "development"
 *       500:
 *         description: API is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: "error"
 *               statusCode: 500
 *               message: "API is unhealthy"
 */
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

// Apply stricter rate limiting to authentication endpoints
app.use('/api/v1/users/login', authLimiter);
app.use('/api/v1/users/register', authLimiter);

// Component auto-discovery and route mounting will happen in startServer

// Phase 5: API Gateway routing
app.use('/api/v1/gateway', (req: Request, res: Response, next: NextFunction) => {
  apiGatewayService.routeRequest(req, res, next);
});

// Error Handling
app.use((_req, _res, next) => next(new ApiError(404, 'Not Found')));
app.use(errorLogger);
app.use(errorMiddleware);

/**
 * Start the server with database connections
 */
const startServer = async () => {
  try {
    // Connect to all data sources (skip in test mode if SKIP_DB_CONNECTION is set)
    if (process.env.SKIP_DB_CONNECTION !== 'true') {
      logger.info('Connecting to databases...');
      await connectPostgres();
      await connectMongo();
      await connectRedis();
      logger.info('All database connections established');
    } else {
      logger.info('Skipping database connections (SKIP_DB_CONNECTION=true)');
    }

    // Auto-discover and register components
    logger.info('Discovering components...');
    const componentsPath = join(__dirname, 'components');
    await componentRegistry.autoDiscover(componentsPath);

    // Initialize all components
    await componentRegistry.initializeAll();

    // Mount component routes
    componentRegistry.mountRoutes(app);
    logger.info(`Mounted ${componentRegistry.getStats().total} components`);

    // Phase 5: Initialize services
    logger.info('Initializing Phase 5 services...');

    // Initialize OAuth service
    oauthService.initialize();
    logger.info('OAuth service initialized');

    // Initialize service discovery
    serviceDiscoveryService.registerService({
      id: 'api-gateway-main',
      name: 'api-gateway',
      version: '1.0.0',
      host: 'localhost',
      port: config.port,
      health: 'healthy',
      metadata: {
        environment: config.nodeEnv,
        features: ['oauth', '2fa', 'websocket', 'microservices'],
      },
      endpoints: ['/api/v1/*'],
    });
    logger.info('Service discovery initialized');

    // Emit system startup event
    await eventService.emitEvent('system.startup', {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0',
    });

    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`API Documentation available at http://localhost:${config.port}/api-docs`);
      logger.info(`Health check available at http://localhost:${config.port}/api/v1/health`);
      logger.info(
        `Readiness probe available at http://localhost:${config.port}/api/v1/health/ready`
      );
      logger.info(`Liveness probe available at http://localhost:${config.port}/api/v1/health/live`);
      logger.info(`WebSocket available at ws://localhost:${config.port}`);
      logger.info(`OAuth providers: ${oauthService.getAvailableProviders().join(', ')}`);
    });

    // Phase 5: Initialize Socket.IO
    socketService.initialize(server);
    logger.info('Socket.IO server initialized');

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      // Emit system shutdown event
      await eventService.emitEvent('system.shutdown', {
        signal,
        timestamp: new Date().toISOString(),
      });

      // Stop accepting new requests
      server.close(async () => {
        logger.info('HTTP server closed');

        // Shutdown all components
        try {
          await componentRegistry.shutdownAll();
        } catch (error) {
          logger.error({ error }, 'Error shutting down components');
        }

        // Close database connections
        try {
          await closePostgres();
          await closeMongo();
          await closeRedis();
          logger.info('All database connections closed');
        } catch (error) {
          logger.error({ error }, 'Error closing database connections');
        }

        // Stop services
        serviceDiscoveryService.stop();
        logger.info('Service discovery stopped');

        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      // Check if it's an operational error
      if (ApiError.isOperationalError(error)) {
        logger.error({ err: error }, 'Operational error (uncaught)');
      } else {
        // Programming error - should restart
        logger.fatal({ err: error }, 'FATAL: Uncaught Exception - Programming Error');
      }

      // Emit system error event
      eventService.emitEvent('system.error', {
        error: error.message,
        stack: error.stack,
        isOperational: ApiError.isOperationalError(error),
        timestamp: new Date().toISOString(),
      });

      // Always shutdown for uncaught exceptions
      shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      // Convert reason to Error if it's not already
      const error = reason instanceof Error ? reason : new Error(String(reason));

      // Check if it's an operational error
      if (ApiError.isOperationalError(error)) {
        logger.error({ err: error, promise }, 'Operational error (unhandled rejection)');
      } else {
        // Programming error - should restart
        logger.fatal(
          { err: error, promise },
          'FATAL: Unhandled Promise Rejection - Programming Error'
        );
      }

      // Emit system error event
      eventService.emitEvent('system.error', {
        error: 'Unhandled Promise Rejection',
        reason: error.message,
        isOperational: ApiError.isOperationalError(error),
        timestamp: new Date().toISOString(),
      });

      // Always shutdown for unhandled rejections
      shutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();

export default app; // Export for testing
