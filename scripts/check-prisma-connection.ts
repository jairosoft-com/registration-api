import { PrismaClient } from '@prisma/client';

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5433/express_template?schema=public';
  process.env.DATABASE_URL = databaseUrl;

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`Prisma connection OK via ${databaseUrl}`);
    process.exit(0);
  } catch (err) {
    console.error('Prisma connection failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
