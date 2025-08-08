import { PrismaClient } from '@prisma/client';
import logger from '@common/utils/logger';

// Define the type for our extended PrismaClient
declare global {
  var prisma: PrismaClient | undefined;
}

// Configure Prisma Client options
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });
};

// Create a singleton instance of Prisma Client
const prisma = globalThis.prisma ?? prismaClientSingleton();

// Set up logging event handlers
if (process.env.NODE_ENV === 'development') {
  // Log queries in development
  (prisma as any).$on('query', (e: any) => {
    logger.debug(
      {
        query: e.query,
        params: e.params,
        duration: e.duration,
      },
      'Prisma Query'
    );
  });
}

// Log errors
(prisma as any).$on('error', (e: any) => {
  logger.error({ err: e }, 'Prisma Error');
});

// Log warnings
(prisma as any).$on('warn', (e: any) => {
  logger.warn({ warning: e }, 'Prisma Warning');
});

// Log info
(prisma as any).$on('info', (e: any) => {
  logger.info({ info: e }, 'Prisma Info');
});

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Connect to the database
 */
export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Prisma connected to database');
  } catch (error) {
    logger.error({ err: error }, 'Failed to connect to database with Prisma');
    throw error;
  }
}

/**
 * Disconnect from the database
 */
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected from database');
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting Prisma');
    throw error;
  }
}

/**
 * Check database connection health
 */
export async function checkPrismaHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Prisma health check failed');
    return false;
  }
}

export default prisma;
