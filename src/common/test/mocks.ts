/**
 * Mock Factories
 * Pre-configured mocks for common dependencies
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'pino';

/**
 * Create a mock Prisma client
 */
export function createMockPrismaClient(): jest.Mocked<PrismaClient> {
  return {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    permission: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    backupCode: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as any;
}

/**
 * Create a mock Redis client
 */
export function createMockRedisClient() {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setEx: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    flushAll: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    publish: jest.fn().mockResolvedValue(1),
    subscribe: jest.fn().mockResolvedValue(undefined),
    unsubscribe: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Create a mock logger
 */
export function createMockLogger(): jest.Mocked<Logger> {
  return {
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    child: jest.fn().mockReturnThis(),
    level: 'info',
    bindings: jest.fn(),
    flush: jest.fn(),
  } as any;
}

/**
 * Create a mock user repository
 */
export function createMockUserRepository() {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByOAuthProvider: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    delete: jest.fn(),
    findAllUsers: jest.fn(),
    verifyPassword: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
    isLocked: jest.fn(),
    enableTwoFactor: jest.fn(),
    addBackupCodes: jest.fn(),
    useBackupCode: jest.fn(),
  };
}

/**
 * Create a mock Socket.IO server
 */
export function createMockSocketServer() {
  return {
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    use: jest.fn(),
    close: jest.fn(),
    listen: jest.fn(),
    sockets: {
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      to: jest.fn().mockReturnThis(),
      connected: {},
    },
  };
}

/**
 * Create a mock Socket.IO client socket
 */
export function createMockSocket() {
  return {
    id: 'mock-socket-id',
    on: jest.fn(),
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    broadcast: {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    },
    handshake: {
      auth: {},
      query: {},
    },
    rooms: new Set(),
    data: {},
  };
}

/**
 * Create a mock Express application
 */
export function createMockApp() {
  return {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn(),
    set: jest.fn(),
    locals: {},
  };
}

/**
 * Create a mock Mongoose model
 */
export function createMockMongooseModel() {
  return {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
    create: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn(),
    lean: jest.fn().mockReturnThis(),
  };
}

/**
 * Mock environment variables for testing
 */
export function mockEnvironment(overrides: Record<string, string> = {}) {
  const original = process.env;

  process.env = {
    ...original,
    NODE_ENV: 'test',
    JWT_SECRET: 'test-secret-key-for-jwt-that-is-at-least-32-characters-long',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    MONGODB_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    ...overrides,
  };

  return () => {
    process.env = original;
  };
}
