import { z } from 'zod';
import dotenv from 'dotenv';

// Only load .env file in non-production environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4010').transform(Number),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  CORS_ORIGIN: z.string().default('*'),

  // JWT Configuration
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Database Configuration
  MONGODB_URI: z.string().default('mongodb://localhost:27017/express-template'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432').transform(Number),
  POSTGRES_DB: z.string().default('express_template'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('password'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),

  // OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),

  // Base URL for OAuth callbacks
  BASE_URL: z.string().default('http://localhost:4010'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const config = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  logLevel: parsedEnv.data.LOG_LEVEL,
  corsOrigin: parsedEnv.data.CORS_ORIGIN,
  baseUrl: parsedEnv.data.BASE_URL,

  jwt: {
    secret: parsedEnv.data.JWT_SECRET,
    expiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  },

  mongo: {
    uri: parsedEnv.data.MONGODB_URI,
  },

  postgres: {
    host: parsedEnv.data.POSTGRES_HOST,
    port: parsedEnv.data.POSTGRES_PORT,
    database: parsedEnv.data.POSTGRES_DB,
    user: parsedEnv.data.POSTGRES_USER,
    password: parsedEnv.data.POSTGRES_PASSWORD,
  },

  redis: {
    host: parsedEnv.data.REDIS_HOST,
    port: parsedEnv.data.REDIS_PORT,
  },

  oauth: {
    google: {
      clientId: parsedEnv.data.GOOGLE_CLIENT_ID,
      clientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: parsedEnv.data.GITHUB_CLIENT_ID,
      clientSecret: parsedEnv.data.GITHUB_CLIENT_SECRET,
    },
    facebook: {
      clientId: parsedEnv.data.FACEBOOK_CLIENT_ID,
      clientSecret: parsedEnv.data.FACEBOOK_CLIENT_SECRET,
    },
  },
};

export default config;
