import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SECURITY } from '../src/common/constants/security.constants';

const prisma = new PrismaClient();

// WARNING: These passwords are for development/testing ONLY
// NEVER use these passwords in production environments
const SEED_PASSWORDS = {
  admin: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  user: process.env.SEED_USER_PASSWORD || 'User123!',
  unverified: process.env.SEED_UNVERIFIED_PASSWORD || 'Test123!',
  oauth: process.env.SEED_OAUTH_PASSWORD || 'OAuth123!',
  twoFactor: process.env.SEED_2FA_PASSWORD || '2FA123!',
};

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('⚠️  Using development passwords - DO NOT use in production!');

  // Clean existing data
  await prisma.backupCode.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  // Create permissions
  const permissions = await Promise.all([
    prisma.permission.create({
      data: {
        name: 'users.read',
        description: 'Read user data',
        resource: 'users',
        action: 'read',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'users.write',
        description: 'Create and update users',
        resource: 'users',
        action: 'write',
      },
    }),
    prisma.permission.create({
      data: {
        name: 'users.delete',
        description: 'Delete users',
        resource: 'users',
        action: 'delete',
      },
    }),
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrator role with full access',
      permissions: {
        create: permissions.map((p) => ({
          permission: { connect: { id: p.id } },
        })),
      },
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'user',
      description: 'Regular user role',
      permissions: {
        create: [
          {
            permission: { connect: { id: permissions[0].id } }, // users.read
          },
        ],
      },
    },
  });

  console.log('✅ Created roles: admin, user');

  // Create test users
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash(SEED_PASSWORDS.admin, SECURITY.PASSWORD.SALT_ROUNDS),
        firstName: 'Admin',
        lastName: 'User',
        emailVerified: true,
        active: true,
        roles: {
          create: {
            role: { connect: { id: adminRole.id } },
          },
        },
      },
    }),
    // Regular user
    prisma.user.create({
      data: {
        email: 'user@example.com',
        password: await bcrypt.hash(SEED_PASSWORDS.user, SECURITY.PASSWORD.SALT_ROUNDS),
        firstName: 'John',
        lastName: 'Doe',
        emailVerified: true,
        active: true,
        roles: {
          create: {
            role: { connect: { id: userRole.id } },
          },
        },
      },
    }),
    // Unverified user
    prisma.user.create({
      data: {
        email: 'unverified@example.com',
        password: await bcrypt.hash(SEED_PASSWORDS.unverified, SECURITY.PASSWORD.SALT_ROUNDS),
        firstName: 'Jane',
        lastName: 'Smith',
        emailVerified: false,
        active: true,
        roles: {
          create: {
            role: { connect: { id: userRole.id } },
          },
        },
      },
    }),
    // OAuth user (Google)
    prisma.user.create({
      data: {
        email: 'oauth@example.com',
        password: await bcrypt.hash(SEED_PASSWORDS.oauth, SECURITY.PASSWORD.SALT_ROUNDS),
        firstName: 'OAuth',
        lastName: 'User',
        emailVerified: true,
        active: true,
        oauthProvider: 'google',
        oauthProviderId: 'google-12345',
        roles: {
          create: {
            role: { connect: { id: userRole.id } },
          },
        },
      },
    }),
    // User with 2FA enabled
    prisma.user.create({
      data: {
        email: '2fa@example.com',
        password: await bcrypt.hash(SEED_PASSWORDS.twoFactor, SECURITY.PASSWORD.SALT_ROUNDS),
        firstName: 'TwoFA',
        lastName: 'User',
        emailVerified: true,
        active: true,
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        backupCodes: {
          create: [
            { code: 'BACKUP-001', used: false },
            { code: 'BACKUP-002', used: false },
            { code: 'BACKUP-003', used: false },
            { code: 'BACKUP-004', used: false },
            { code: 'BACKUP-005', used: false },
          ],
        },
        roles: {
          create: {
            role: { connect: { id: userRole.id } },
          },
        },
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);

  // Display created users
  console.log('\n📝 Test Users Created:');
  console.log('========================');
  console.log('Email: admin@example.com');
  console.log(`Password: ${SEED_PASSWORDS.admin}`);
  console.log('------------------------');
  console.log('Email: user@example.com');
  console.log(`Password: ${SEED_PASSWORDS.user}`);
  console.log('------------------------');
  console.log('Email: unverified@example.com');
  console.log(`Password: ${SEED_PASSWORDS.unverified}`);
  console.log('------------------------');
  console.log('Email: oauth@example.com');
  console.log(`Password: ${SEED_PASSWORDS.oauth}`);
  console.log('------------------------');
  console.log('Email: 2fa@example.com');
  console.log(`Password: ${SEED_PASSWORDS.twoFactor}`);
  console.log('------------------------');

  console.log('\n⚠️  Remember: These are development passwords only!');
  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
