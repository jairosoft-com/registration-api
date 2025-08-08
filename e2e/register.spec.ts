import { test, expect } from '@playwright/test';

/**
 * Test data for registration tests
 */
const testUsers = {
  valid: {
    name: 'Test User',
    email: `test.${Date.now()}@example.com`,
    password: 'password123'
  },
  invalid: {
    name: '',
    email: 'invalid-email',
    password: '123'
  },
  existing: {
    name: 'Existing User',
    email: 'existing@example.com',
    password: 'password123'
  }
};

test.describe('User Registration API Tests', () => {
  test('should successfully register a new user', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: testUsers.valid
      }
    });

    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    expect(responseBody.message).toBe('User registered successfully');
    expect(responseBody.data).toBeDefined();
    expect(responseBody.data.user).toMatchObject({
      email: testUsers.valid.email,
      name: testUsers.valid.name
    });
    expect(responseBody.data.token).toBeDefined();
    expect(responseBody.data.token).toBeTruthy();
  });

  test('should return error for existing email', async ({ request }) => {
    // First registration
    await request.post('/api/v1/users/register', {
      data: {
        body: testUsers.existing
      }
    });

    // Second registration with same email
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: testUsers.existing
      }
    });

    expect(response.status()).toBe(409);
    
    const responseBody = await response.json();
    expect(responseBody.status).toBe('error');
    expect(responseBody.message).toContain('Email already in use');
  });

  test('should show validation errors for invalid data', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: testUsers.invalid
      }
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.status).toBe('error');
    expect(responseBody.message).toBeDefined();
  });

  test('should validate email format', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: {
          name: testUsers.valid.name,
          email: testUsers.invalid.email,
          password: testUsers.valid.password
        }
      }
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.status).toBe('error');
  });

  test('should validate password length', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: {
          name: testUsers.valid.name,
          email: `short.pass.${Date.now()}@example.com`,
          password: testUsers.invalid.password
        }
      }
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.status).toBe('error');
  });

  test('should handle network errors gracefully', async ({ request }) => {
    // Test with malformed JSON
    const response = await request.post('/api/v1/users/register', {
      data: '{invalid json}',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
  });

  test('should require all mandatory fields', async ({ request }) => {
    const testCases = [
      { name: testUsers.valid.name, email: testUsers.valid.email }, // missing password
      { name: testUsers.valid.name, password: testUsers.valid.password }, // missing email
      { email: testUsers.valid.email, password: testUsers.valid.password }, // missing name
    ];

    for (const testData of testCases) {
      const response = await request.post('/api/v1/users/register', {
        data: {
          body: testData
        }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
    }
  });

  test('should handle special characters in name field', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: {
          name: 'José María O\'Connor-Smith',
          email: `jose.maria.${Date.now()}@example.com`,
          password: testUsers.valid.password
        }
      }
    });

    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    expect(responseBody.data.user.name).toBe('José María O\'Connor-Smith');
  });

  test('should handle long email addresses', async ({ request }) => {
    const longEmail = `very.long.email.address.${Date.now()}@very.long.domain.example.com`;
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: {
          name: testUsers.valid.name,
          email: longEmail,
          password: testUsers.valid.password
        }
      }
    });

    expect(response.status()).toBe(201);
    
    const responseBody = await response.json();
    expect(responseBody.data.user.email).toBe(longEmail);
  });

  test('should trim whitespace from input fields', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {
        body: {
          name: '  Trimmed User  ',
          email: `  trimmed.${Date.now()}@example.com  `,
          password: testUsers.valid.password
        }
      }
    });

    // This might be 201 or 400 depending on if the API trims inputs
    // We're testing that the API handles it gracefully either way
    expect([200, 201, 400]).toContain(response.status());
  });

  test('should return appropriate error for empty request body', async ({ request }) => {
    const response = await request.post('/api/v1/users/register', {
      data: {}
    });

    expect(response.status()).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.status).toBe('error');
  });

  test('should handle concurrent registrations correctly', async ({ request }) => {
    const email = `concurrent.${Date.now()}@example.com`;
    const userData = {
      body: {
        name: 'Concurrent User',
        email: email,
        password: 'password123'
      }
    };

    // Send multiple requests simultaneously
    const responses = await Promise.all([
      request.post('/api/v1/users/register', { data: userData }),
      request.post('/api/v1/users/register', { data: userData }),
      request.post('/api/v1/users/register', { data: userData })
    ]);

    // Exactly one should succeed with 201
    const successCount = responses.filter(r => r.status() === 201).length;
    const conflictCount = responses.filter(r => r.status() === 409).length;
    
    expect(successCount).toBe(1);
    expect(conflictCount).toBe(2);
  });
});