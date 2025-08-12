import { z } from 'zod';

// Helper function to validate name pattern (letters and spaces only)
export const validateNamePattern = (name: string): boolean => {
  return /^[a-zA-Z\s]+$/.test(name);
};

// Helper function to validate email match
export const validateEmailMatch = (data: { email: string; confirmEmail: string }): boolean => {
  return data.email.toLowerCase() === data.confirmEmail.toLowerCase();
};

// Registration request schema matching OpenAPI specification
export const RegistrationRequestSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must be at most 50 characters')
      .refine(validateNamePattern, {
        message: 'First name must contain letters and spaces only',
      }),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must be at most 50 characters')
      .refine(validateNamePattern, {
        message: 'Last name must contain letters and spaces only',
      }),
    email: z
      .string()
      .email('Invalid email format')
      .max(255, 'Email must be at most 255 characters'),
    confirmEmail: z
      .string()
      .email('Invalid email format')
      .max(255, 'Confirm email must be at most 255 characters'),
    schedule: z.string().datetime({ message: 'Schedule must be a valid ISO 8601 datetime' }),
  })
  .refine(validateEmailMatch, {
    message: 'Email addresses do not match',
    path: ['confirmEmail'],
  });

// Validation-only schema (same as registration but for validation endpoint)
export const RegistrationValidationSchema = RegistrationRequestSchema;

// Schedule query parameters schema
export const ScheduleQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
});

// API Key validation schema
export const ApiKeySchema = z.object({
  'x-api-key': z.string().min(1, 'API key is required'),
});

// Transform validation errors to API response format
export const formatValidationErrors = (
  errors: z.ZodIssue[]
): Array<{
  field: string;
  message: string;
  code?: string;
}> => {
  return errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code.toUpperCase().replace(/_/g, '_'),
  }));
};

// Type exports
export type RegistrationRequest = z.infer<typeof RegistrationRequestSchema>;
export type ScheduleQuery = z.infer<typeof ScheduleQuerySchema>;
