import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  registerNewUser,
  loginUser,
  getUserById,
  updateUserById,
  deleteUserById,
  getAllUsers,
} from './users.service';
import { userRepository } from '@/database/repositories/user.repository';
import { ApiError } from '@common/utils/ApiError';
import config from '@/config';

// Mock dependencies
jest.mock('@/database/repositories/user.repository');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('@/config', () => ({
  jwt: {
    secret: 'test-secret-key-that-is-at-least-32-characters-long',
    expiresIn: '1d',
  },
  nodeEnv: 'test',
}));

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('User Service', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
  };

  const mockUserPublicData = {
    id: mockUser.id,
    name: mockUser.name,
    email: mockUser.email,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerNewUser', () => {
    const registrationData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      // Mock repository responses
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUserPublicData);

      // Mock bcrypt
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      // Mock JWT
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await registerNewUser(registrationData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registrationData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registrationData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...registrationData,
        password: 'hashed-password',
      });
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUserPublicData.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });
      expect(result).toEqual({
        user: mockUserPublicData,
        token: 'mock-jwt-token',
      });
    });

    it('should throw error if user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUserPublicData);

      await expect(registerNewUser(registrationData)).rejects.toThrow(
        new ApiError(409, 'Email already in use')
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(registrationData.email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle repository errors during user creation', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(registerNewUser(registrationData)).rejects.toThrow('Database error');
    });
  });

  describe('loginUser', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      // Mock repository responses
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);

      // Mock bcrypt
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Mock JWT
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await loginUser(loginData.email, loginData.password);

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });
      expect(result).toEqual({
        user: mockUserPublicData,
        token: 'mock-jwt-token',
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(loginUser(loginData.email, loginData.password)).rejects.toThrow(
        new ApiError(401, 'Invalid credentials')
      );

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(loginData.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error if password is incorrect', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(loginUser(loginData.email, loginData.password)).rejects.toThrow(
        new ApiError(401, 'Invalid credentials')
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUserPublicData);

      const result = await getUserById('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserPublicData);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(getUserById('user-123')).rejects.toThrow(new ApiError(404, 'User not found'));
    });
  });

  describe('updateUserById', () => {
    const updateData = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should successfully update user', async () => {
      const updatedUser = { ...mockUserPublicData, ...updateData };
      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await updateUserById('user-123', updateData);

      expect(mockUserRepository.updateById).toHaveBeenCalledWith('user-123', updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.updateById.mockResolvedValue(null);

      await expect(updateUserById('user-123', updateData)).rejects.toThrow(
        new ApiError(404, 'User not found')
      );
    });
  });

  describe('deleteUserById', () => {
    it('should successfully delete user', async () => {
      mockUserRepository.deleteById.mockResolvedValue(true);

      const result = await deleteUserById('user-123');

      expect(mockUserRepository.deleteById).toHaveBeenCalledWith('user-123');
      expect(result).toBe(true);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.deleteById.mockResolvedValue(false);

      await expect(deleteUserById('user-123')).rejects.toThrow(new ApiError(404, 'User not found'));
    });
  });

  describe('getAllUsers', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [mockUserPublicData];
      const mockResponse = {
        users: mockUsers,
        total: 1,
      };
      mockUserRepository.findAll.mockResolvedValue(mockResponse);

      const result = await getAllUsers(10, 0);

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(10, 0);
      expect(result).toEqual(mockResponse);
    });

    it('should use default pagination values', async () => {
      const mockResponse = {
        users: [],
        total: 0,
      };
      mockUserRepository.findAll.mockResolvedValue(mockResponse);

      await getAllUsers();

      expect(mockUserRepository.findAll).toHaveBeenCalledWith(10, 0);
    });
  });
});
