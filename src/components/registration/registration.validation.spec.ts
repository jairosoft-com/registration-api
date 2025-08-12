import {
  RegistrationRequestSchema,
  RegistrationValidationSchema,
  validateEmailMatch,
  validateNamePattern,
} from './registration.validation';

describe('Registration Validation', () => {
  describe('RegistrationRequestSchema', () => {
    it('should validate a complete valid registration request', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject registration with short firstName', () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('firstName');
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject registration with long lastName', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'D'.repeat(51),
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('lastName');
        expect(result.error.issues[0].message).toContain('at most 50 characters');
      }
    });

    it('should reject names with numbers', () => {
      const invalidData = {
        firstName: 'John123',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('firstName');
        expect(result.error.issues[0].message).toContain('letters and spaces only');
      }
    });

    it('should accept names with spaces', () => {
      const validData = {
        firstName: 'Mary Jane',
        lastName: 'Van Der Berg',
        email: 'mary.jane@example.com',
        confirmEmail: 'mary.jane@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        confirmEmail: 'invalid-email',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject mismatched emails', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'different@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email addresses do not match');
      }
    });

    it('should reject invalid datetime format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: 'invalid-date',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('schedule');
      }
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        firstName: 'John',
      };

      const result = RegistrationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('RegistrationValidationSchema', () => {
    it('should validate without throwing errors', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const result = RegistrationValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateEmailMatch', () => {
    it('should return true for matching emails', () => {
      const data = {
        email: 'test@example.com',
        confirmEmail: 'test@example.com',
      };
      expect(validateEmailMatch(data, null as any)).toBe(true);
    });

    it('should return false for non-matching emails', () => {
      const data = {
        email: 'test@example.com',
        confirmEmail: 'different@example.com',
      };
      expect(validateEmailMatch(data, null as any)).toBe(false);
    });

    it('should handle case differences', () => {
      const data = {
        email: 'Test@Example.com',
        confirmEmail: 'test@example.com',
      };
      expect(validateEmailMatch(data, null as any)).toBe(true);
    });
  });

  describe('validateNamePattern', () => {
    it('should return true for valid names', () => {
      expect(validateNamePattern('John')).toBe(true);
      expect(validateNamePattern('Mary Jane')).toBe(true);
      expect(validateNamePattern('Van Der Berg')).toBe(true);
    });

    it('should return false for names with numbers', () => {
      expect(validateNamePattern('John123')).toBe(false);
      expect(validateNamePattern('123')).toBe(false);
    });

    it('should return false for names with special characters', () => {
      expect(validateNamePattern('John@Doe')).toBe(false);
      expect(validateNamePattern('John-Doe')).toBe(false);
    });
  });
});
