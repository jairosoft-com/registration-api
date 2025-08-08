/**
 * Test Data Factories
 * Functions to generate test data with realistic values
 */

import { faker } from '@faker-js/faker';
import { User, Role, Permission, Session } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Generate a random ID
 */
export function generateId(): string {
  return faker.string.uuid();
}

/**
 * Create a test user
 */
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: generateId(),
    email: faker.internet.email().toLowerCase(),
    password: bcrypt.hashSync('Test123!', 10),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    avatar: faker.image.avatar(),
    emailVerified: true,
    active: true,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    oauthProvider: null,
    oauthProviderId: null,
    loginAttempts: 0,
    lockUntil: null,
    lastLogin: faker.date.recent(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create a test user without password
 */
export function createTestUserPublic(overrides: Partial<User> = {}) {
  const user = createTestUser(overrides);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, twoFactorSecret, ...publicUser } = user;
  return publicUser;
}

/**
 * Create a test session
 */
export function createTestSession(userId?: string): Session {
  return {
    id: generateId(),
    userId: userId || generateId(),
    token: faker.string.alphanumeric(64),
    userAgent: faker.internet.userAgent(),
    ip: faker.internet.ip(),
    expiresAt: faker.date.future(),
    createdAt: faker.date.recent(),
  };
}

/**
 * Create a test role
 */
export function createTestRole(overrides: Partial<Role> = {}): Role {
  const roleNames = ['admin', 'user', 'moderator', 'editor', 'viewer'];
  const name = faker.helpers.arrayElement(roleNames);

  return {
    id: generateId(),
    name,
    description: `${name.charAt(0).toUpperCase() + name.slice(1)} role with specific permissions`,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create a test permission
 */
export function createTestPermission(overrides: Partial<Permission> = {}): Permission {
  const resources = ['users', 'posts', 'comments', 'settings', 'reports'];
  const actions = ['read', 'write', 'delete', 'update'];
  const resource = faker.helpers.arrayElement(resources);
  const action = faker.helpers.arrayElement(actions);

  return {
    id: generateId(),
    name: `${resource}.${action}`,
    description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
    resource,
    action,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Create test JWT payload
 */
export function createTestJwtPayload(userId?: string) {
  return {
    id: userId || generateId(),
    email: faker.internet.email(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
}

/**
 * Create test registration data
 */
export function createTestRegistrationData() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    email: faker.internet.email().toLowerCase(),
    password: 'Test123!',
    firstName,
    lastName,
  };
}

/**
 * Create test login data
 */
export function createTestLoginData(email?: string) {
  return {
    email: email || faker.internet.email().toLowerCase(),
    password: 'Test123!',
  };
}

/**
 * Create test OAuth profile
 */
export function createTestOAuthProfile(provider: 'google' | 'github' | 'facebook' = 'google') {
  const email = faker.internet.email();
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.alphanumeric(20),
    displayName: `${firstName} ${lastName}`,
    emails: [{ value: email, verified: true }],
    photos: [{ value: faker.image.avatar() }],
    provider,
    _json: {
      email,
      given_name: firstName,
      family_name: lastName,
      picture: faker.image.avatar(),
    },
  };
}

/**
 * Create test 2FA secret
 */
export function createTest2FASecret() {
  return {
    secret: faker.string.alphanumeric(32).toUpperCase(),
    qrCode: `data:image/png;base64,${faker.string.alphanumeric(100)}`,
    backupCodes: Array.from({ length: 5 }, () => faker.string.alphanumeric(8).toUpperCase()),
  };
}

/**
 * Create test API response
 */
export function createTestApiResponse<T = any>(
  success: boolean = true,
  data?: T,
  message?: string
) {
  if (success) {
    return {
      success: true,
      data,
      message: message || 'Operation successful',
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: false,
    error: {
      message: message || 'Operation failed',
      code: 'ERROR_CODE',
      statusCode: 400,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create test pagination data
 */
export function createTestPagination<T>(items: T[], page: number = 1, limit: number = 10) {
  return {
    items,
    pagination: {
      page,
      limit,
      total: items.length,
      totalPages: Math.ceil(items.length / limit),
      hasNext: page * limit < items.length,
      hasPrev: page > 1,
    },
  };
}

/**
 * Create batch of test users
 */
export function createTestUserBatch(count: number = 5): User[] {
  return Array.from({ length: count }, () => createTestUser());
}

/**
 * Create test error
 */
export function createTestError(
  message: string = 'Test error',
  statusCode: number = 500,
  code?: string
) {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}
