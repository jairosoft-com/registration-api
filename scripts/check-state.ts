import mongoose from 'mongoose';
import { createClient } from 'redis';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/express-template';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
const expectEmpty = process.argv.includes('--expect-empty');
const skipRedis = process.argv.includes('--skip-redis');

async function checkMongo() {
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db!;
  const collections = await db.collections();
  const users = await db
    .collection('users')
    .countDocuments()
    .catch(() => 0);
  await mongoose.disconnect();
  return { collections: collections.length, users };
}

async function checkRedis() {
  const client = createClient({ url: redisUrl });
  await client.connect();
  const size = await client.dbSize();
  await client.quit();
  return { keys: size };
}

async function main() {
  const mongo = await checkMongo();
  const redis = skipRedis ? undefined : await checkRedis();
  console.log(JSON.stringify({ mongo, redis }, null, 2));

  if (expectEmpty) {
    if (mongo.users !== 0 || (!skipRedis && redis && redis.keys !== 0)) {
      console.error('Expected empty state; found data remaining');
      process.exit(1);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
