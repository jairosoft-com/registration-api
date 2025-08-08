import { User, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import bcrypt from 'bcryptjs';
import { ApiError } from '@common/utils/ApiError';
import { SECURITY } from '@common/constants/security.constants';

// Define types for user operations
export type UserWithoutPassword = Omit<User, 'password'>;
export type UserCreateInput = Omit<Prisma.UserCreateInput, 'id' | 'createdAt' | 'updatedAt'>;
export type UserUpdateInput = Partial<UserCreateInput>;
export type UserPublicData = Pick<
  User,
  'id' | 'email' | 'firstName' | 'lastName' | 'avatar' | 'emailVerified'
>;

/**
 * User Repository using Prisma
 * Handles all database operations for users
 */
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor() {
    super('User');
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      return user;
    } catch (error) {
      this.logger.error({ err: error, email }, 'Error finding user by email');
      throw error;
    }
  }

  /**
   * Find a user by OAuth provider
   */
  async findByOAuthProvider(provider: string, providerId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          oauthProvider: provider,
          oauthProviderId: providerId,
        },
      });
      return user;
    } catch (error) {
      this.logger.error(
        { err: error, provider, providerId },
        'Error finding user by OAuth provider'
      );
      throw error;
    }
  }

  /**
   * Create a new user with hashed password
   */
  async createUser(data: UserCreateInput): Promise<UserPublicData> {
    try {
      // Hash password (required field)
      data.password = await bcrypt.hash(data.password, SECURITY.PASSWORD.SALT_ROUNDS);

      // Ensure email is lowercase
      if (data.email) {
        data.email = data.email.toLowerCase();
      }

      const user = await this.prisma.user.create({
        data: data as Prisma.UserCreateInput,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
        },
      });

      return user;
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw ApiError.conflict('Email already exists');
      }
      this.logger.error({ err: error }, 'Error creating user');
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(id: string, data: UserUpdateInput): Promise<UserPublicData> {
    try {
      // Hash password if being updated and has a value
      if (typeof data.password === 'string' && data.password) {
        data.password = await bcrypt.hash(data.password, SECURITY.PASSWORD.SALT_ROUNDS);
      }

      // Ensure email is lowercase if being updated
      if ('email' in data && data.email) {
        data.email = (data.email as string).toLowerCase();
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: data as Prisma.UserUpdateInput,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
        },
      });

      return user;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        throw ApiError.notFound('User not found');
      }
      if ((error as any).code === 'P2002') {
        throw ApiError.conflict('Email already exists');
      }
      this.logger.error({ err: error, id }, 'Error updating user');
      throw error;
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        return false;
      }

      return bcrypt.compare(password, user.password);
    } catch (error) {
      this.logger.error({ err: error, userId }, 'Error verifying password');
      throw error;
    }
  }

  /**
   * Increment login attempts
   */
  async incrementLoginAttempts(email: string): Promise<void> {
    try {
      const user = await this.findByEmail(email);
      if (!user) return;

      const attempts = user.loginAttempts + 1;
      const lockUntil =
        attempts >= SECURITY.LOGIN.MAX_ATTEMPTS
          ? new Date(Date.now() + SECURITY.LOGIN.LOCK_DURATION_MS)
          : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockUntil,
        },
      });
    } catch (error) {
      this.logger.error({ err: error, email }, 'Error incrementing login attempts');
      throw error;
    }
  }

  /**
   * Reset login attempts
   */
  async resetLoginAttempts(userId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: 0,
          lockUntil: null,
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      this.logger.error({ err: error, userId }, 'Error resetting login attempts');
      throw error;
    }
  }

  /**
   * Check if user account is locked
   */
  async isLocked(email: string): Promise<boolean> {
    try {
      const user = await this.findByEmail(email);
      if (!user) return false;

      if (user.lockUntil && user.lockUntil > new Date()) {
        return true;
      }

      // Unlock if lock period has expired
      if (user.lockUntil) {
        await this.resetLoginAttempts(user.id);
      }

      return false;
    } catch (error) {
      this.logger.error({ err: error, email }, 'Error checking if user is locked');
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
        },
      });
    } catch (error) {
      this.logger.error({ err: error, userId }, 'Error enabling two-factor authentication');
      throw error;
    }
  }

  /**
   * Add backup codes for two-factor authentication
   */
  async addBackupCodes(userId: string, codes: string[]): Promise<void> {
    try {
      await this.prisma.backupCode.createMany({
        data: codes.map((code) => ({
          userId,
          code,
        })),
      });
    } catch (error) {
      this.logger.error({ err: error, userId }, 'Error adding backup codes');
      throw error;
    }
  }

  /**
   * Use a backup code
   */
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const backupCode = await this.prisma.backupCode.findFirst({
        where: {
          userId,
          code,
          used: false,
        },
      });

      if (!backupCode) {
        return false;
      }

      await this.prisma.backupCode.update({
        where: { id: backupCode.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      this.logger.error({ err: error, userId }, 'Error using backup code');
      throw error;
    }
  }

  /**
   * Get all users (paginated)
   */
  async findAllUsers(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<{ users: UserPublicData[]; total: number }> {
    try {
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          ...params,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            emailVerified: true,
          },
        }),
        this.prisma.user.count({ where: params.where }),
      ]);

      return { users, total };
    } catch (error) {
      this.logger.error({ err: error }, 'Error finding all users');
      throw error;
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
