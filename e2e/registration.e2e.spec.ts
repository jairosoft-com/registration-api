import { test, expect } from '@playwright/test';

test.describe('Class Registration API E2E Tests', () => {
  test.describe('POST /v1/registration', () => {
    test('should successfully register a student for a class', async ({ request }) => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `john.doe.${Date.now()}@example.com`,
        confirmEmail: `john.doe.${Date.now()}@example.com`,
        schedule: '2024-03-15T10:00:00Z',
      };

      const response = await request.post('/v1/registration', {
        data: registrationData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toBe('Registration submitted successfully');
      expect(responseBody.registrationId).toBeDefined();
      expect(responseBody.registrationId).toMatch(/^reg_/);
      expect(responseBody.emailSent).toBe(true);
      expect(responseBody.adminNotificationSent).toBe(true);
      expect(responseBody.nextSteps).toBe('Check your email for confirmation details');
    });

    test('should return 400 for invalid email format', async ({ request }) => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        confirmEmail: 'invalid-email',
        schedule: '2024-03-15T10:00:00Z',
      };

      const response = await request.post('/v1/registration', {
        data: invalidData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Validation failed');
      expect(responseBody.errors).toBeDefined();
      expect(responseBody.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('Invalid email format'),
        })
      );
    });

    test('should return 400 when email and confirmEmail do not match', async ({ request }) => {
      const mismatchedData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'different.email@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const response = await request.post('/v1/registration', {
        data: mismatchedData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Validation failed');
      expect(responseBody.errors).toContainEqual(
        expect.objectContaining({
          field: 'confirmEmail',
          message: 'Email addresses do not match',
        })
      );
    });

    test('should return 400 for invalid name with numbers', async ({ request }) => {
      const invalidNameData = {
        firstName: 'John123',
        lastName: 'Doe456',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const response = await request.post('/v1/registration', {
        data: invalidNameData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.errors).toContainEqual(
        expect.objectContaining({
          field: 'firstName',
          message: expect.stringContaining('letters and spaces only'),
        })
      );
    });

    test('should return 409 for duplicate registration', async ({ request }) => {
      const email = `duplicate.${Date.now()}@example.com`;
      const registrationData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: email,
        confirmEmail: email,
        schedule: '2024-03-15T10:00:00Z',
      };

      // First registration should succeed
      const firstResponse = await request.post('/v1/registration', {
        data: registrationData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });
      expect(firstResponse.status()).toBe(201);

      // Second registration with same email should fail
      const duplicateResponse = await request.post('/v1/registration', {
        data: registrationData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(duplicateResponse.status()).toBe(409);

      const responseBody = await duplicateResponse.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toBe('Registration already exists for this email');
      expect(responseBody.errorCode).toBe('DUPLICATE_REGISTRATION');
      expect(responseBody.existingRegistrationId).toBeDefined();
    });

    test('should return 401 without API key', async ({ request }) => {
      const registrationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const response = await request.post('/v1/registration', {
        data: registrationData,
      });

      expect(response.status()).toBe(401);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toContain('API key');
    });
  });

  test.describe('POST /v1/registration/validate', () => {
    test('should validate correct registration data', async ({ request }) => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        confirmEmail: 'john.doe@example.com',
        schedule: '2024-03-15T10:00:00Z',
      };

      const response = await request.post('/v1/registration/validate', {
        data: validData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.valid).toBe(true);
      expect(responseBody.message).toBe('All fields are valid');
      expect(responseBody.errors).toBeUndefined();
    });

    test('should return validation errors for invalid data', async ({ request }) => {
      const invalidData = {
        firstName: 'J', // Too short
        lastName: '', // Empty
        email: 'invalid',
        confirmEmail: 'different',
        schedule: 'invalid-date',
      };

      const response = await request.post('/v1/registration/validate', {
        data: invalidData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.valid).toBe(false);
      expect(responseBody.message).toBe('Validation failed');
      expect(responseBody.errors).toBeDefined();
      expect(responseBody.errors.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /v1/schedule/available', () => {
    test('should return available schedules', async ({ request }) => {
      const response = await request.get('/v1/schedule/available', {
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.schedules).toBeDefined();
      expect(Array.isArray(responseBody.schedules)).toBe(true);
      expect(responseBody.schedules.length).toBeGreaterThan(0);

      // Check first schedule structure
      const firstSchedule = responseBody.schedules[0];
      expect(firstSchedule).toHaveProperty('id');
      expect(firstSchedule).toHaveProperty('date');
      expect(firstSchedule).toHaveProperty('time');
      expect(firstSchedule).toHaveProperty('available');
      expect(firstSchedule).toHaveProperty('maxCapacity');
      expect(firstSchedule).toHaveProperty('currentEnrollment');
    });

    test('should filter schedules by date', async ({ request }) => {
      const response = await request.get('/v1/schedule/available?date=2024-03-15', {
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.schedules).toBeDefined();

      // All returned schedules should be for the requested date
      responseBody.schedules.forEach((schedule: any) => {
        expect(schedule.date).toBe('2024-03-15');
      });
    });

    test('should respect limit parameter', async ({ request }) => {
      const limit = 5;
      const response = await request.get(`/v1/schedule/available?limit=${limit}`, {
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.schedules.length).toBeLessThanOrEqual(limit);
    });
  });

  test.describe('GET /v1/registration/{registrationId}', () => {
    test('should retrieve registration details by ID', async ({ request }) => {
      // First create a registration
      const email = `test.${Date.now()}@example.com`;
      const registrationData = {
        firstName: 'Test',
        lastName: 'User',
        email: email,
        confirmEmail: email,
        schedule: '2024-03-15T10:00:00Z',
      };

      const createResponse = await request.post('/v1/registration', {
        data: registrationData,
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(createResponse.status()).toBe(201);
      const createBody = await createResponse.json();
      const registrationId = createBody.registrationId;

      // Now retrieve the registration
      const getResponse = await request.get(`/v1/registration/${registrationId}`, {
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(getResponse.status()).toBe(200);

      const responseBody = await getResponse.json();
      expect(responseBody.id).toBe(registrationId);
      expect(responseBody.firstName).toBe('Test');
      expect(responseBody.lastName).toBe('User');
      expect(responseBody.email).toBe(email);
      expect(responseBody.schedule).toBe('2024-03-15T10:00:00Z');
      expect(responseBody.status).toBe('confirmed');
      expect(responseBody.emailSent).toBe(true);
      expect(responseBody.createdAt).toBeDefined();
    });

    test('should return 404 for non-existent registration', async ({ request }) => {
      const response = await request.get('/v1/registration/reg_nonexistent123', {
        headers: {
          'X-API-Key': 'test-api-key-123',
        },
      });

      expect(response.status()).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.message).toContain('not found');
    });
  });
});
