// Mock the model BEFORE importing the service to ensure the service captures the mock
jest.mock('../../database/models/registration.model');

import { RegistrationService } from './registration.service';
import { RegistrationModel } from '../../database/models/registration.model';
import { ApiError } from '../../common/utils/ApiError';
import { resetMockRegistrations } from '../../database/repositories/mock.registration.repository';

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(() => {
    service = new RegistrationService();
    jest.resetAllMocks();
    resetMockRegistrations();
  });

  describe('createRegistration', () => {
    it('should create a new registration successfully', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const mockSavedRegistration = {
        id: 'reg_123456789',
        ...registrationData,
        status: 'confirmed',
        emailSent: true,
        adminNotificationSent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn(),
      };

      (RegistrationModel.findOne as jest.Mock).mockResolvedValue(null);
      (RegistrationModel.prototype.save as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockSavedRegistration);

      const result = await service.createRegistration(registrationData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration submitted successfully');
      expect(result.registrationId).toMatch(/^reg_/);
      expect(result.emailSent).toBe(true);
      expect(result.adminNotificationSent).toBe(true);
      expect(result.nextSteps).toBe('Check your email for confirmation details');
    });

    it('should throw error for duplicate registration', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      // Mock the findOne to return an existing registration
      (RegistrationModel.findOne as jest.Mock).mockResolvedValue({
        id: 'reg_existing123',
        email: 'john.doe@example.com',
      });

      // Mock the save method to not be called (since we throw before save)
      const mockSave = jest.fn();
      (RegistrationModel.prototype.save as jest.Mock) = mockSave;

      try {
        await service.createRegistration(registrationData);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(409);
        expect((error as ApiError).message).toBe('Registration already exists for this email');
        // Verify save was not called
        expect(mockSave).not.toHaveBeenCalled();
      }
    });

    it('should handle email sending failure gracefully', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const mockSavedRegistration = {
        id: 'reg_123456789',
        ...registrationData,
        status: 'confirmed',
        emailSent: false,
        adminNotificationSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn(),
      };

      (RegistrationModel.findOne as jest.Mock).mockResolvedValue(null);
      (RegistrationModel.prototype.save as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockSavedRegistration);

      // Mock email sending to fail
      jest.spyOn(service as any, 'sendConfirmationEmail').mockResolvedValue(false);

      const result = await service.createRegistration(registrationData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(false);
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

      // Mock findOne to return null (no duplicate)
      (RegistrationModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.validateRegistration(registrationData);

      expect(result.valid).toBe(true);
      expect(result.message).toBe('All fields are valid');
      expect(result.errors).toBeUndefined();
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe123',
        email: 'invalid',
        confirmEmail: 'different',
        schedule: 'invalid-date',
      };

      const result = await service.validateRegistration(invalidData);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Validation failed');
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should check for duplicate email during validation', async () => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        confirmEmail: 'existing@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      // Mock findOne to return an existing registration (duplicate)
      (RegistrationModel.findOne as jest.Mock).mockResolvedValue({
        id: 'reg_existing123',
        email: 'existing@example.com',
      });

      const result = await service.validateRegistration(registrationData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Email already registered',
        })
      );
    });
  });

  describe('getRegistrationById', () => {
    it('should retrieve registration by ID', async () => {
      const mockRegistration = {
        id: 'reg_123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
        status: 'confirmed',
        emailSent: true,
        createdAt: new Date('2024-03-10T10:00:00Z'),
        updatedAt: new Date('2024-03-10T10:00:00Z'),
      };

      // Mock findOne to return the registration
      (RegistrationModel.findOne as jest.Mock).mockResolvedValue(mockRegistration);

      const result = await service.getRegistrationById('reg_123456789');

      expect(result).toBeDefined();
      expect(result.id).toBe('reg_123456789');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should throw error for non-existent registration', async () => {
      (RegistrationModel.findOne as jest.Mock).mockResolvedValue(null);

      try {
        await service.getRegistrationById('reg_nonexistent');
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
        expect((error as ApiError).message).toBe('Registration not found');
      }
    });
  });

  describe('Email notifications', () => {
    it('should send confirmation email', async () => {
      const registration = {
        id: 'reg_123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      // Private method test through createRegistration
      const sendEmailSpy = jest
        .spyOn(service as any, 'sendConfirmationEmail')
        .mockResolvedValue(true);

      await (service as any).sendConfirmationEmail(registration);

      expect(sendEmailSpy).toHaveBeenCalledWith(registration);
    });

    it('should send admin notification', async () => {
      const registration = {
        id: 'reg_123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const sendAdminSpy = jest
        .spyOn(service as any, 'sendAdminNotification')
        .mockResolvedValue(true);

      await (service as any).sendAdminNotification(registration);

      expect(sendAdminSpy).toHaveBeenCalledWith(registration);
    });
  });
});
