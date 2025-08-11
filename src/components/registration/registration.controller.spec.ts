import { Request, Response, NextFunction } from 'express';
import {
  createRegistration,
  validateRegistration,
  getRegistrationById,
} from './registration.controller';
import { registrationService } from './registration.service';
import { ApiError } from '../../common/utils/ApiError';

// Mock the service
jest.mock('./registration.service');

describe('RegistrationController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createRegistration', () => {
    it('should create registration successfully', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const serviceResponse = {
        success: true,
        message: 'Registration submitted successfully',
        registrationId: 'reg_123456789',
        emailSent: true,
        adminNotificationSent: true,
        nextSteps: 'Check your email for confirmation details',
      };

      mockRequest.body = registrationData;
      (registrationService.createRegistration as jest.Mock).mockResolvedValue(serviceResponse);

      await createRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe',
        email: 'invalid',
        confirmEmail: 'different',
        schedule: 'invalid-date',
      };

      mockRequest.body = invalidData;

      await createRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
    });

    it('should handle duplicate registration error', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        confirmEmail: 'existing@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      mockRequest.body = registrationData;

      const duplicateError = new ApiError(409, 'Registration already exists for this email', {
        errorCode: 'DUPLICATE_REGISTRATION',
        existingRegistrationId: 'reg_existing123',
      });

      (registrationService.createRegistration as jest.Mock).mockRejectedValue(duplicateError);

      await createRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(duplicateError);
    });
  });

  describe('validateRegistration', () => {
    it('should validate correct data', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const validationResponse = {
        valid: true,
        message: 'All fields are valid',
      };

      mockRequest.body = registrationData;
      (registrationService.validateRegistration as jest.Mock).mockResolvedValue(validationResponse);

      await validateRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(validationResponse);
    });

    it('should return validation errors', async () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe123',
        email: 'invalid',
        confirmEmail: 'different',
        schedule: 'invalid-date',
      };

      const validationResponse = {
        valid: false,
        message: 'Validation failed',
        errors: [
          { field: 'firstName', message: 'First name must be at least 2 characters' },
          { field: 'lastName', message: 'Last name must contain letters and spaces only' },
          { field: 'email', message: 'Invalid email format' },
        ],
      };

      mockRequest.body = invalidData;
      (registrationService.validateRegistration as jest.Mock).mockResolvedValue(validationResponse);

      await validateRegistration(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(validationResponse);
    });
  });

  describe('getRegistrationById', () => {
    it('should retrieve registration by ID', async () => {
      const registrationDetails = {
        id: 'reg_123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
        createdAt: '2024-03-10T10:00:00Z',
        status: 'confirmed',
        emailSent: true,
      };

      mockRequest.params = { registrationId: 'reg_123456789' };
      (registrationService.getRegistrationById as jest.Mock).mockResolvedValue(registrationDetails);

      await getRegistrationById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(registrationDetails);
    });

    it('should handle not found error', async () => {
      const notFoundError = new ApiError(404, 'Registration not found');

      mockRequest.params = { registrationId: 'reg_nonexistent' };
      (registrationService.getRegistrationById as jest.Mock).mockRejectedValue(notFoundError);

      await getRegistrationById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });

    it('should handle missing registration ID', async () => {
      mockRequest.params = {};

      await getRegistrationById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
    });
  });
});
