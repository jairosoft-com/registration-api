import mongoose from 'mongoose';
import config from '@/config';
import logger from '@common/utils/logger';

// Global variable to store the connection (singleton pattern)
const globalForMongo = global as unknown as { mongoConnection: typeof mongoose | undefined };

let mongoConnection: typeof mongoose;

// Implement singleton pattern for MongoDB connection
if (process.env.NODE_ENV === 'production') {
  mongoConnection = mongoose;
} else {
  if (!globalForMongo.mongoConnection) {
    globalForMongo.mongoConnection = mongoose;
  }
  mongoConnection = globalForMongo.mongoConnection;
}

/**
 * Connect to MongoDB with proper configuration
 */
export const connectMongo = async (): Promise<void> => {
  // Check if already connected
  if (mongoConnection.connection.readyState >= 1) {
    logger.info('MongoDB already connected');
    return;
  }

  try {
    await mongoConnection.connect(config.mongo.uri, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    });
    logger.info('Successfully connected to MongoDB');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
};

/**
 * Check MongoDB connection health
 */
export const checkMongoHealth = async (): Promise<boolean> => {
  try {
    if (mongoConnection.connection.readyState === 1 && mongoConnection.connection.db) {
      await mongoConnection.connection.db.admin().ping();
      return true;
    }
    return false;
  } catch (error) {
    logger.error({ error }, 'MongoDB health check failed');
    return false;
  }
};

/**
 * Gracefully close MongoDB connection
 */
export const closeMongo = async (): Promise<void> => {
  try {
    if (mongoConnection.connection.readyState >= 1) {
      await mongoConnection.connection.close();
      logger.info('MongoDB connection closed gracefully');
    }
  } catch (error) {
    logger.error({ error }, 'Error closing MongoDB connection');
  }
};

// Connection event handlers
mongoConnection.connection.on('connected', () => {
  logger.info('MongoDB connected');
});

mongoConnection.connection.on('error', (err) => {
  logger.error({ err }, 'MongoDB connection error');
});

mongoConnection.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoConnection.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

export default mongoConnection;
