import { Pool } from 'pg';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import config from '@/config';
import logger from '@/common/utils/logger';

async function cleanupPostgres() {
  const pool = new Pool({
    host: config.postgres.host,
    port: config.postgres.port,
    database: config.postgres.database,
    user: config.postgres.user,
    password: config.postgres.password,
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    await client.query('COMMIT');
    logger.info('PostgreSQL schema reset');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Error cleaning PostgreSQL');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function cleanupMongo() {
  try {
    await mongoose.connect(config.mongo.uri);
    await mongoose.connection.dropDatabase();
    logger.info('MongoDB database dropped');
  } finally {
    await mongoose.disconnect();
  }
}

async function cleanupRedis() {
  const client = createClient({ url: `redis://${config.redis.host}:${config.redis.port}` });
  client.on('error', (err) => logger.error({ err }, 'Redis client error'));
  await client.connect();
  try {
    await client.flushAll();
    logger.info('Redis FLUSHALL completed');
  } finally {
    await client.quit();
  }
}

async function main() {
  try {
    logger.info('Starting E2E cleanup...');
    await cleanupPostgres().catch((e) => logger.warn({ e }, 'Postgres cleanup failed/skipped'));
    await cleanupMongo().catch((e) => logger.warn({ e }, 'Mongo cleanup failed/skipped'));
    await cleanupRedis().catch((e) => logger.warn({ e }, 'Redis cleanup failed/skipped'));
    logger.info('E2E cleanup completed');
  } catch (error) {
    logger.error({ error }, 'E2E cleanup encountered errors');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
