import { test, expect } from '@playwright/test';

test.describe('User API E2E Tests', () => {
  test.describe('POST /api/v1/users/register', () => {
    test('should register a user and return 201', async ({ request }) => {
      const userData = {
        body: {
          name: 'E2E Test User',
          email: `e2e.test.${Date.now()}@example.com`,
          password: 'password123',
        }
      };

      const response = await request.post('/api/v1/users/register', {
        data: userData
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe('User registered successfully');
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.user).toBeDefined();
      expect(responseBody.data.user.email).toBe(userData.body.email);
      expect(responseBody.data.token).toBeDefined();
    });

    test('should return 409 when email already exists', async ({ request }) => {
      const userData = {
        body: {
          name: 'Duplicate User',
          email: 'duplicate@example.com',
          password: 'password123',
        }
      };

      // First registration should succeed
      await request.post('/api/v1/users/register', {
        data: userData
      });

      // Second registration with same email should fail
      const response = await request.post('/api/v1/users/register', {
        data: userData
      });

      expect(response.status()).toBe(409);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('Email already in use');
    });

    test('should return 400 for invalid data', async ({ request }) => {
      const invalidData = {
        body: {
          name: '',
          email: 'invalid-email',
          password: '123',
        }
      };

      const response = await request.post('/api/v1/users/register', {
        data: invalidData
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
    });

    test('should return 400 for missing required fields', async ({ request }) => {
      const response = await request.post('/api/v1/users/register', {
        data: {}
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
    });
  });

  test.describe('POST /api/v1/users/login', () => {
    test('should login successfully with valid credentials', async ({ request }) => {
      const timestamp = Date.now();
      const userData = {
        body: {
          name: 'Login Test User',
          email: `login.test.${timestamp}@example.com`,
          password: 'password123',
        }
      };

      // First register the user
      await request.post('/api/v1/users/register', {
        data: userData
      });

      // Then try to login
      const loginData = {
        body: {
          email: userData.body.email,
          password: userData.body.password,
        }
      };

      const response = await request.post('/api/v1/users/login', {
        data: loginData
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe('Login successful');
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.user).toBeDefined();
      expect(responseBody.data.user.email).toBe(userData.body.email);
      expect(responseBody.data.token).toBeDefined();
    });

    test('should return 401 for invalid credentials', async ({ request }) => {
      const loginData = {
        body: {
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        }
      };

      const response = await request.post('/api/v1/users/login', {
        data: loginData
      });

      expect(response.status()).toBe(401);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('Invalid credentials');
    });

    test('should return 400 for invalid email format', async ({ request }) => {
      const loginData = {
        body: {
          email: 'invalid-email',
          password: 'password123',
        }
      };

      const response = await request.post('/api/v1/users/login', {
        data: loginData
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
    });
  });

  test.describe('Health Check Endpoints', () => {
    test('should return 200 for root health check', async ({ request }) => {
      const response = await request.get('/');

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.message).toBe('API is healthy');
      expect(responseBody.timestamp).toBeDefined();
      expect(responseBody.uptime).toBeDefined();
    });

    test('should return 200 for /api/v1/health endpoint', async ({ request }) => {
      const response = await request.get('/api/v1/health');

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('healthy');
      expect(responseBody.timestamp).toBeDefined();
    });

    test('should return 200 for readiness probe', async ({ request }) => {
      const response = await request.get('/api/v1/health/ready');

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.ready).toBeDefined();
    });

    test('should return 200 for liveness probe', async ({ request }) => {
      const response = await request.get('/api/v1/health/live');

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.alive).toBe(true);
    });
  });

  test.describe('API Documentation', () => {
    test('should serve Swagger documentation', async ({ request }) => {
      const response = await request.get('/api-docs/');

      expect(response.status()).toBe(200);
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/html');
    });
  });
});