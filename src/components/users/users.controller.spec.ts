import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import * as userService from './users.service';
import { registerUser, loginUser } from './users.controller';
import { ApiError } from '@common/utils/ApiError';

// Mock config before importing anything that uses it
jest.mock('@/config', () => ({
  jwt: {
    secret: 'test-secret-key-that-is-at-least-32-characters-long',
    expiresIn: '1d',
  },
  nodeEnv: 'test',
}));

// Mock the user service
jest.mock('./users.service');

const mockUserService = userService as jest.Mocked<typeof userService>;

describe('User Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      headers: {},
      method: 'POST',
      url: '/api/v1/users/register',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    const validRegistrationData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a user', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockToken = 'mock-jwt-token';

      mockRequest.body = { body: validRegistrationData };
      mockUserService.registerNewUser.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      await registerUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.registerNewUser).toHaveBeenCalledWith(validRegistrationData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User registered successfully',
        data: {
          user: mockUser,
          token: mockToken,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.body = { invalid: 'data' }; // Invalid data structure

      await registerUser(mockRequest as Request, mockResponse as Response, mockNext);

      // The actual error will be a ZodError from parsing
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new ApiError(409, 'Email already in use');
      mockRequest.body = { body: validRegistrationData };
      mockUserService.registerNewUser.mockRejectedValue(serviceError);

      await registerUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Database connection failed');
      mockRequest.body = { body: validRegistrationData };
      mockUserService.registerNewUser.mockRejectedValue(unexpectedError);

      await registerUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });
  });

  describe('loginUser', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockToken = 'mock-jwt-token';

      mockRequest.body = { body: validLoginData };
      mockUserService.loginUser.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      await loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.loginUser).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        data: {
          user: mockUser,
          token: mockToken,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors for login', async () => {
      mockRequest.body = { invalid: 'data' }; // Invalid data structure

      await loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      // The actual error will be a ZodError from parsing
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('should handle authentication errors', async () => {
      const authError = new ApiError(401, 'Invalid credentials');
      mockRequest.body = { body: validLoginData };
      mockUserService.loginUser.mockRejectedValue(authError);

      await loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(authError);
    });

    it('should handle missing credentials', async () => {
      mockRequest.body = { email: 'test@example.com' }; // Missing password

      await loginUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Should be handled by Zod validation
      expect(mockUserService.loginUser).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should pass errors to next middleware', async () => {
      mockRequest.body = {}; // Will cause validation error

      await registerUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Should pass the ZodError to the next middleware
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(ZodError);
    });

    it('should handle null request body', async () => {
      mockRequest.body = null;

      await registerUser(mockRequest as Request, mockResponse as Response, mockNext);

      // Should be handled by Zod validation
      expect(mockUserService.registerNewUser).not.toHaveBeenCalled();
    });
  });
});
