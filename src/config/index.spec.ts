import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

describe('Configuration Module', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    // Clear module cache to allow re-importing with different env
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('dotenv loading behavior', () => {
    it('should NOT load .env file in production environment', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'production-secret-from-environment-variables-not-from-dotenv';

      // Mock dotenv to track if config() is called
      const mockDotenvConfig = jest.fn();
      jest.doMock('dotenv', () => ({
        config: mockDotenvConfig,
      }));

      // Act - Import config module (this will trigger the conditional dotenv loading)
      require('./index');

      // Assert - dotenv.config() should NOT be called in production
      expect(mockDotenvConfig).not.toHaveBeenCalled();
    });

    it('should load .env file in development environment', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      process.env.JWT_SECRET = 'development-secret-that-is-at-least-32-characters-long';

      // Mock dotenv to track if config() is called
      const mockDotenvConfig = jest.fn();
      jest.doMock('dotenv', () => ({
        config: mockDotenvConfig,
      }));

      // Act - Import config module
      require('./index');

      // Assert - dotenv.config() SHOULD be called in development
      expect(mockDotenvConfig).toHaveBeenCalled();
    });

    it('should load .env file in test environment', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-testing';

      // Mock dotenv to track if config() is called
      const mockDotenvConfig = jest.fn();
      jest.doMock('dotenv', () => ({
        config: mockDotenvConfig,
      }));

      // Act - Import config module
      require('./index');

      // Assert - dotenv.config() SHOULD be called in test
      expect(mockDotenvConfig).toHaveBeenCalled();
    });

    it('should load .env file when NODE_ENV is undefined', () => {
      // Arrange
      delete process.env.NODE_ENV;
      process.env.JWT_SECRET = 'default-secret-that-is-at-least-32-characters-long';

      // Mock dotenv to track if config() is called
      const mockDotenvConfig = jest.fn();
      jest.doMock('dotenv', () => ({
        config: mockDotenvConfig,
      }));

      // Act - Import config module
      require('./index');

      // Assert - dotenv.config() SHOULD be called when NODE_ENV is undefined
      expect(mockDotenvConfig).toHaveBeenCalled();
    });
  });

  describe('configuration validation', () => {
    it('should validate and export configuration object', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
      process.env.PORT = '3000';

      // Act
      const config = require('./index').default;

      // Assert
      expect(config).toBeDefined();
      expect(config.nodeEnv).toBe('test');
      expect(config.port).toBe(3000);
      expect(config.jwt.secret).toBe('test-jwt-secret-that-is-at-least-32-characters-long');
    });

    it('should throw error if JWT_SECRET is less than 32 characters', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.JWT_SECRET = 'short-secret';

      // Act & Assert
      expect(() => {
        require('./index');
      }).toThrow();
    });
  });
});
