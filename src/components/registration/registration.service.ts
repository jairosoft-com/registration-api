import { RegistrationModel as MongooseRegistrationModel } from '../../database/models/registration.model';
import {
  MockRegistrationModel,
  createMockRegistrationModel,
} from '../../database/repositories/mock.registration.repository';
import { ApiError } from '../../common/utils/ApiError';
import logger from '../../common/utils/logger';
import {
  RegistrationRequest,
  RegistrationRequestSchema,
  formatValidationErrors,
} from './registration.validation';
import {
  RegistrationResponse,
  ValidationResponse,
  RegistrationDetails,
} from './registration.types';

// Use mock model when DB connection is skipped
const RegistrationModel =
  process.env.SKIP_DB_CONNECTION === 'true' ? MockRegistrationModel : MongooseRegistrationModel;

const createRegistrationInstance =
  process.env.SKIP_DB_CONNECTION === 'true'
    ? createMockRegistrationModel
    : (data: any) => new MongooseRegistrationModel(data);

export class RegistrationService {
  /**
   * Create a new registration
   */
  async createRegistration(data: RegistrationRequest): Promise<RegistrationResponse> {
    try {
      // Check for duplicate registration
      const existingRegistration = await RegistrationModel.findOne({
        email: data.email.toLowerCase(),
      });

      if (existingRegistration) {
        const error = new ApiError(409, 'Registration already exists for this email');
        (error as any).errorCode = 'DUPLICATE_REGISTRATION';
        (error as any).existingRegistrationId = existingRegistration.id;
        throw error;
      }

      // Generate unique registration ID
      const registrationId = `reg_${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

      // Create new registration
      const registration = createRegistrationInstance({
        id: registrationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        schedule: data.schedule,
        status: 'confirmed',
        emailSent: false,
        adminNotificationSent: false,
      });

      // Save registration
      const savedRegistration = await registration.save();

      // Send emails (non-blocking)
      const emailSent = await this.sendConfirmationEmail(savedRegistration);
      const adminNotificationSent = await this.sendAdminNotification(savedRegistration);

      // Update email status
      savedRegistration.emailSent = emailSent;
      savedRegistration.adminNotificationSent = adminNotificationSent;
      await savedRegistration.save();

      logger.info(
        {
          registrationId: savedRegistration.id,
          email: savedRegistration.email,
        },
        'Registration created successfully'
      );

      return {
        success: true,
        message: 'Registration submitted successfully',
        registrationId: savedRegistration.id,
        emailSent,
        adminNotificationSent,
        nextSteps: 'Check your email for confirmation details',
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error({ error }, 'Failed to create registration');
      throw new ApiError(500, 'Failed to create registration');
    }
  }

  /**
   * Validate registration data without saving
   */
  async validateRegistration(data: any): Promise<ValidationResponse> {
    try {
      // Validate schema
      const result = RegistrationRequestSchema.safeParse(data);

      if (!result.success) {
        return {
          valid: false,
          message: 'Validation failed',
          errors: formatValidationErrors(result.error.issues),
        };
      }

      // Check for duplicate email
      const existingRegistration = await RegistrationModel.findOne({
        email: data.email.toLowerCase(),
      });

      if (existingRegistration) {
        return {
          valid: false,
          message: 'Validation failed',
          errors: [
            {
              field: 'email',
              message: 'Email already registered',
              code: 'DUPLICATE_EMAIL',
            },
          ],
        };
      }

      return {
        valid: true,
        message: 'All fields are valid',
      };
    } catch (error) {
      logger.error({ error }, 'Validation error');
      return {
        valid: false,
        message: 'Validation failed',
        errors: [
          {
            field: 'general',
            message: 'An error occurred during validation',
          },
        ],
      };
    }
  }

  /**
   * Get registration by ID
   */
  async getRegistrationById(registrationId: string): Promise<RegistrationDetails> {
    try {
      const registration = await RegistrationModel.findOne({ id: registrationId });

      if (!registration) {
        throw new ApiError(404, 'Registration not found');
      }

      return {
        id: registration.id,
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        schedule: registration.schedule,
        createdAt: registration.createdAt.toISOString(),
        status: registration.status,
        emailSent: registration.emailSent,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error({ error }, 'Failed to get registration');
      throw new ApiError(500, 'Failed to retrieve registration');
    }
  }

  /**
   * Send confirmation email to student
   * Mock implementation for now
   */
  private async sendConfirmationEmail(registration: any): Promise<boolean> {
    try {
      // Mock email sending
      logger.info(
        {
          to: registration.email,
          registrationId: registration.id,
        },
        'Sending confirmation email'
      );

      // In production, integrate with email service (SendGrid, SES, etc.)
      // For now, simulate success
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to send confirmation email');
      return false;
    }
  }

  /**
   * Send notification to admin
   * Mock implementation for now
   */
  private async sendAdminNotification(registration: any): Promise<boolean> {
    try {
      // Mock admin notification
      logger.info(
        {
          registrationId: registration.id,
          studentEmail: registration.email,
        },
        'Sending admin notification'
      );

      // In production, integrate with notification service
      // For now, simulate success
      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to send admin notification');
      return false;
    }
  }
}

// Export singleton instance
export const registrationService = new RegistrationService();
