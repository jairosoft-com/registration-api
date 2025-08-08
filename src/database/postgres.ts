import { Pool } from 'pg';
import config from '@/config';
import logger from '@common/utils/logger';

// Global variable to store the pool instance (singleton pattern)
const globalForPg = global as unknown as { pgPool: Pool | undefined };

let pool: Pool;

// Implement singleton pattern for connection pool
if (process.env.NODE_ENV === 'production') {
  // In production, always create a new pool
  pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    database: config.postgres.database,
    user: config.postgres.user,
    password: config.postgres.password,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  });
} else {
  // In development, use singleton pattern to prevent multiple pools during hot reload
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  pool = globalForPg.pgPool;
}

// Connection event handlers
pool.on('connect', () => {
  logger.debug('New PostgreSQL client connected');
});

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

pool.on('remove', () => {
  logger.debug('PostgreSQL client removed from pool');
});

/**
 * Connect to PostgreSQL and verify connection
 */
export const connectPostgres = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Successfully connected to PostgreSQL');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to PostgreSQL');
    throw error;
  }
};

/**
 * Check PostgreSQL connection health
 */
export const checkPostgresHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.error({ error }, 'PostgreSQL health check failed');
    return false;
  }
};

/**
 * Gracefully close PostgreSQL connections
 */
export const closePostgres = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('PostgreSQL connections closed gracefully');
  } catch (error) {
    logger.error({ error }, 'Error closing PostgreSQL connections');
  }
};

export default pool;
