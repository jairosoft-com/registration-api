import { describe, it, expect } from '@jest/globals';
import { ApiError } from './ApiError';

describe('Enhanced ApiError Class', () => {
  describe('Basic Error Properties', () => {
    it('should create an error with status code and message', () => {
      const error = new ApiError(404, 'Resource not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should have a name property set to ApiError', () => {
      const error = new ApiError(500, 'Internal error');

      expect(error.name).toBe('ApiError');
    });

    it('should capture stack trace', () => {
      const error = new ApiError(400, 'Bad request');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });
  });

  describe('Operational Error Flag', () => {
    it('should default to operational error (true)', () => {
      const error = new ApiError(400, 'Bad request');

      expect(error.isOperational).toBe(true);
    });

    it('should allow setting operational flag to false', () => {
      const error = new ApiError(500, 'Database connection failed', false);

      expect(error.isOperational).toBe(false);
    });

    it('should treat 4xx errors as operational by default', () => {
      const error400 = new ApiError(400, 'Bad request');
      const error401 = new ApiError(401, 'Unauthorized');
      const error403 = new ApiError(403, 'Forbidden');
      const error404 = new ApiError(404, 'Not found');

      expect(error400.isOperational).toBe(true);
      expect(error401.isOperational).toBe(true);
      expect(error403.isOperational).toBe(true);
      expect(error404.isOperational).toBe(true);
    });
  });

  describe('Error Context', () => {
    it('should support additional context data', () => {
      const context = {
        userId: '123',
        action: 'updateProfile',
        timestamp: new Date().toISOString(),
      };

      const error = new ApiError(400, 'Validation failed', true, context);

      expect(error.context).toEqual(context);
    });

    it('should handle undefined context', () => {
      const error = new ApiError(500, 'Server error');

      expect(error.context).toBeUndefined();
    });

    it('should preserve context when converting to JSON', () => {
      const context = { field: 'email', value: 'invalid@' };
      const error = new ApiError(400, 'Invalid email', true, context);

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ApiError',
        message: 'Invalid email',
        statusCode: 400,
        isOperational: true,
        context: context,
        stack: expect.any(String),
      });
    });
  });

  describe('Error Factory Methods', () => {
    it('should have static method for BadRequest (400)', () => {
      const error = ApiError.badRequest('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    it('should have static method for Unauthorized (401)', () => {
      const error = ApiError.unauthorized('Please authenticate');

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Please authenticate');
      expect(error.isOperational).toBe(true);
    });

    it('should have static method for Forbidden (403)', () => {
      const error = ApiError.forbidden('Access denied');

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Access denied');
      expect(error.isOperational).toBe(true);
    });

    it('should have static method for NotFound (404)', () => {
      const error = ApiError.notFound('Resource not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
    });

    it('should have static method for Conflict (409)', () => {
      const error = ApiError.conflict('Resource already exists');

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource already exists');
      expect(error.isOperational).toBe(true);
    });

    it('should have static method for UnprocessableEntity (422)', () => {
      const error = ApiError.unprocessableEntity('Cannot process request');

      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Cannot process request');
      expect(error.isOperational).toBe(true);
    });

    it('should have static method for InternalError (500)', () => {
      const error = ApiError.internal('Something went wrong');

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Something went wrong');
      expect(error.isOperational).toBe(false); // Internal errors are not operational
    });

    it('should have static method for ServiceUnavailable (503)', () => {
      const error = ApiError.serviceUnavailable('Service temporarily unavailable');

      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Service temporarily unavailable');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to JSON properly', () => {
      const error = new ApiError(400, 'Bad request', true, { field: 'email' });
      const json = error.toJSON();

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('statusCode');
      expect(json).toHaveProperty('isOperational');
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('stack');
    });

    it('should omit stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new ApiError(500, 'Server error');
      const json = error.toJSON();

      expect(json.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new ApiError(500, 'Server error');
      const json = error.toJSON();

      expect(json.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Type Checking', () => {
    it('should identify as ApiError type', () => {
      const error = new ApiError(400, 'Bad request');

      expect(ApiError.isApiError(error)).toBe(true);
    });

    it('should not identify regular Error as ApiError', () => {
      const error = new Error('Regular error');

      expect(ApiError.isApiError(error)).toBe(false);
    });

    it('should identify operational errors correctly', () => {
      const operationalError = new ApiError(400, 'Bad request', true);
      const programmerError = new ApiError(500, 'Database error', false);

      expect(ApiError.isOperationalError(operationalError)).toBe(true);
      expect(ApiError.isOperationalError(programmerError)).toBe(false);
    });
  });
});
