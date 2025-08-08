import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRegistrationInput, UserPublicData } from './users.types';
import { ApiError } from '@common/utils/ApiError';
import { BaseService } from '@common/base/BaseService';
import config from '@/config';
import { parseFullName } from '@common/utils/name.utils';

// Import both repositories for migration phase
import { userRepository as prismaUserRepository } from '@/repositories/user.repository';
import { userRepository as mongoUserRepository } from '@/database/repositories/user.repository';

// Feature flag to switch between Mongoose and Prisma
const USE_PRISMA = process.env.USE_PRISMA === 'true' || false;

/**
 * User Service
 * Handles business logic for user operations
 */
export class UserService extends BaseService {
  private repository: any;

  constructor() {
    super('users');
    // Use Prisma repository if feature flag is enabled
    this.repository = USE_PRISMA ? prismaUserRepository : mongoUserRepository;
    this.logger.info(`Using ${USE_PRISMA ? 'Prisma' : 'Mongoose'} repository for users`);
  }

  /**
   * Register a new user
   * @param userData - The registration data for the new user
   * @returns Promise<{ user: UserPublicData; token: string }>
   */
  async registerNewUser(
    userData: UserRegistrationInput
  ): Promise<{ user: UserPublicData; token: string }> {
    // Check if user already exists
    const existingUser = await this.repository.findByEmail(userData.email);
    if (existingUser) {
      throw ApiError.conflict('Email already in use');
    }

    // Create user using repository (password hashing handled by Prisma repository)
    const newUser = USE_PRISMA
      ? await this.repository.createUser(userData)
      : await this.repository.create({
          ...userData,
          password: await bcrypt.hash(userData.password, 10),
        });

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    return { user: newUser, token };
  }

  /**
   * Login a user
   * @param email - The user's email
   * @param password - The user's password
   * @returns Promise<{ user: UserPublicData; token: string }>
   */
  async loginUser(
    email: string,
    password: string
  ): Promise<{ user: UserPublicData; token: string }> {
    // Check if account is locked
    if (USE_PRISMA) {
      const isLocked = await this.repository.isLocked(email);
      if (isLocked) {
        throw ApiError.forbidden('Account is locked due to too many failed login attempts');
      }
    }

    // Find user
    const user = USE_PRISMA
      ? await this.repository.findByEmail(email)
      : await this.repository.findByEmailWithPassword(email);

    if (!user) {
      if (USE_PRISMA) {
        await this.repository.incrementLoginAttempts(email);
      }
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      if (USE_PRISMA) {
        await this.repository.incrementLoginAttempts(email);
      }
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (USE_PRISMA) {
      await this.repository.resetLoginAttempts(user.id);
    }

    // Prepare user public data
    let firstName: string;
    let lastName: string;

    if (USE_PRISMA) {
      firstName = user.firstName;
      lastName = user.lastName;
    } else {
      const parsed = parseFullName(user.name);
      firstName = parsed.firstName;
      lastName = parsed.lastName;
    }

    const userPublicData: UserPublicData = {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
      avatar: USE_PRISMA ? user.avatar : undefined,
      emailVerified: USE_PRISMA ? user.emailVerified : false,
    };

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    return { user: userPublicData, token };
  }

  /**
   * Get user by ID
   * @param id - The user's ID
   * @returns Promise<UserPublicData>
   */
  async getUserById(id: string): Promise<UserPublicData> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (USE_PRISMA) {
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      };
    }

    return user;
  }

  /**
   * Update user by ID
   * @param id - The user's ID
   * @param updateData - The data to update
   * @returns Promise<UserPublicData>
   */
  async updateUserById(
    id: string,
    updateData: Partial<UserRegistrationInput>
  ): Promise<UserPublicData> {
    const updatedUser = USE_PRISMA
      ? await this.repository.updateUser(id, updateData)
      : await this.repository.updateById(id, updateData);

    if (!updatedUser) {
      throw ApiError.notFound('User not found');
    }

    return updatedUser;
  }

  /**
   * Delete user by ID
   * @param id - The user's ID
   * @returns Promise<boolean>
   */
  async deleteUserById(id: string): Promise<boolean> {
    const deleted = USE_PRISMA
      ? await this.repository.delete(id)
      : await this.repository.deleteById(id);

    if (!deleted) {
      throw ApiError.notFound('User not found');
    }

    return true;
  }

  /**
   * Get all users with pagination
   * @param limit - Number of users to return
   * @param skip - Number of users to skip
   * @returns Promise<{ users: UserPublicData[]; total: number }>
   */
  async getAllUsers(
    limit: number = 10,
    skip: number = 0
  ): Promise<{ users: UserPublicData[]; total: number }> {
    if (USE_PRISMA) {
      return await this.repository.findAllUsers({
        skip,
        take: limit,
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return await this.repository.findAll(limit, skip);
  }

  /**
   * Enable two-factor authentication for a user
   * @param userId - The user's ID
   * @param secret - The TOTP secret
   * @param backupCodes - Array of backup codes
   */
  async enableTwoFactor(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    if (USE_PRISMA) {
      await this.repository.enableTwoFactor(userId, secret);
      await this.repository.addBackupCodes(userId, backupCodes);
    } else {
      // Mongoose implementation would go here
      throw new Error('Two-factor authentication not implemented for Mongoose');
    }
  }

  /**
   * Verify a backup code
   * @param userId - The user's ID
   * @param code - The backup code
   * @returns Promise<boolean>
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    if (USE_PRISMA) {
      return await this.repository.useBackupCode(userId, code);
    }

    // Mongoose implementation would go here
    return false;
  }
}

// Export singleton instance
export const userService = new UserService();

// Re-export functions for backward compatibility
export const registerNewUser = userService.registerNewUser.bind(userService);
export const loginUser = userService.loginUser.bind(userService);
export const getUserById = userService.getUserById.bind(userService);
export const updateUserById = userService.updateUserById.bind(userService);
export const deleteUserById = userService.deleteUserById.bind(userService);
export const getAllUsers = userService.getAllUsers.bind(userService);
