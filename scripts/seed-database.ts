import { connectPostgres, closePostgres } from '../src/database/postgres';
import { connectMongo, closeMongo } from '../src/database/mongo';
import { connectRedis, closeRedis } from '../src/database/redis';
import { UserModel } from '../src/database/models/user.model';
import bcrypt from 'bcryptjs';
import logger from '../src/utils/logger';
import config from '../src/config';

interface SeedUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const seedUsers: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'john.doe@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  {
    email: 'bob.wilson@example.com',
    password: 'password123',
    firstName: 'Bob',
    lastName: 'Wilson',
  },
  {
    email: 'alice.johnson@example.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Johnson',
  },
];

const seedPostgres = async () => {
  try {
    logger.info('Seeding PostgreSQL database...');

    // Add PostgreSQL seeding logic here when you have PostgreSQL models
    // For now, we'll just log that PostgreSQL seeding is ready
    logger.info('PostgreSQL seeding completed (no models to seed yet)');
  } catch (error) {
    logger.error('Error seeding PostgreSQL:', error);
    throw error;
  }
};

const seedMongo = async () => {
  try {
    logger.info('Seeding MongoDB database...');

    // Clear existing users
    await UserModel.deleteMany({});
    logger.info('Cleared existing users from MongoDB');

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      seedUsers.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12),
      }))
    );

    // Insert users
    const createdUsers = await UserModel.insertMany(hashedUsers);
    logger.info(`Created ${createdUsers.length} users in MongoDB`);

    // Log created users (without passwords)
    createdUsers.forEach((user) => {
      logger.info(`Created user: ${user.email} (${user.firstName} ${user.lastName})`);
    });
  } catch (error) {
    logger.error('Error seeding MongoDB:', error);
    throw error;
  }
};

const seedRedis = async () => {
  try {
    logger.info('Seeding Redis database...');

    // Add Redis seeding logic here when you have Redis data to seed
    // For now, we'll just log that Redis seeding is ready
    logger.info('Redis seeding completed (no data to seed yet)');
  } catch (error) {
    logger.error('Error seeding Redis:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Connect to all databases
    await connectPostgres();
    await connectMongo();
    await connectRedis();

    // Seed each database
    await seedPostgres();
    await seedMongo();
    await seedRedis();

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connections
    await closePostgres();
    await closeMongo();
    await closeRedis();
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase, seedUsers };
