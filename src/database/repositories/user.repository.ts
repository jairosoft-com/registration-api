import { UserPublicData } from '@components/users/users.types';
import { UserModel } from '../models/user.model';
import { ApiError } from '@common/utils/ApiError';
import { mockUserRepository } from './mock.user.repository';

/**
 * Helper function to safely concatenate user names
 * Handles null/undefined values gracefully
 */
function formatUserName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  if (first && last) {
    return `${first} ${last}`;
  }

  return first || last || 'Unknown User';
}

/**
 * User Repository
 *
 * Implements the repository pattern for user data access.
 * Provides a clean abstraction layer between the service layer
 * and the data access layer.
 */
export class UserRepository {
  /**
   * Find a user by their ID
   * @param id - The user's ID
   * @returns Promise<UserPublicData | null>
   */
  async findById(id: string): Promise<UserPublicData | null> {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: formatUserName(user.firstName, user.lastName),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      throw new ApiError(500, 'Database error while finding user');
    }
  }

  /**
   * Find a user by their email address
   * @param email - The user's email address
   * @returns Promise<UserPublicData | null>
   */
  async findByEmail(email: string): Promise<UserPublicData | null> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: formatUserName(user.firstName, user.lastName),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      };
    } catch (error) {
      throw new ApiError(500, 'Database error while finding user by email');
    }
  }

  /**
   * Find a user by email including password (for authentication)
   * @param email - The user's email address
   * @returns Promise<any | null> - User with password included
   */
  async findByEmailWithPassword(email: string): Promise<any | null> {
    try {
      const user = await UserModel.findOne({ email }).select('+password');
      return user;
    } catch (error) {
      throw new ApiError(500, 'Database error while finding user with password');
    }
  }

  /**
   * Create a new user
   * @param userData - The user data to create
   * @returns Promise<UserPublicData>
   */
  async create(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<UserPublicData> {
    try {
      const newUser = await UserModel.create(userData);

      return {
        id: newUser.id,
        name: formatUserName(newUser.firstName, newUser.lastName),
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        avatar: newUser.avatar,
        emailVerified: newUser.emailVerified,
      };
    } catch (error: any) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new ApiError(409, 'Email already in use');
      }
      throw new ApiError(500, 'Database error while creating user');
    }
  }

  /**
   * Update a user by ID
   * @param id - The user's ID
   * @param updateData - The data to update
   * @returns Promise<UserPublicData | null>
   */
  async updateById(
    id: string,
    updateData: Partial<{ firstName: string; lastName: string; email: string }>
  ): Promise<UserPublicData | null> {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        return null;
      }

      return {
        id: updatedUser.id,
        name: formatUserName(updatedUser.firstName, updatedUser.lastName),
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        emailVerified: updatedUser.emailVerified,
      };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ApiError(409, 'Email already in use');
      }
      throw new ApiError(500, 'Database error while updating user');
    }
  }

  /**
   * Delete a user by ID
   * @param id - The user's ID
   * @returns Promise<boolean>
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw new ApiError(500, 'Database error while deleting user');
    }
  }

  /**
   * Get all users (with pagination)
   * @param limit - Number of users to return
   * @param skip - Number of users to skip
   * @returns Promise<{ users: UserPublicData[]; total: number }>
   */
  async findAll(
    limit: number = 10,
    skip: number = 0
  ): Promise<{ users: UserPublicData[]; total: number }> {
    try {
      const [users, total] = await Promise.all([
        UserModel.find().limit(limit).skip(skip),
        UserModel.countDocuments(),
      ]);

      const userPublicData = users.map((user) => ({
        id: user.id,
        name: formatUserName(user.firstName, user.lastName),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      }));

      return {
        users: userPublicData,
        total,
      };
    } catch (error) {
      throw new ApiError(500, 'Database error while fetching users');
    }
  }

  /**
   * Check if a user exists by email
   * @param email - The email to check
   * @returns Promise<boolean>
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ email });
      return count > 0;
    } catch (error) {
      throw new ApiError(500, 'Database error while checking user existence');
    }
  }
}

// Export a singleton instance
// Use mock repository when databases are not connected
export const userRepository =
  process.env.SKIP_DB_CONNECTION === 'true' ? mockUserRepository : new UserRepository();
