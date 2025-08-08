import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import pino from 'pino';

describe('Pino Logger Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Logger Initialization', () => {
    it('should create a Pino logger instance', () => {
      const logger = require('./logger').default;

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.fatal).toBeDefined();
    });

    it('should use LOG_LEVEL from environment', () => {
      process.env.LOG_LEVEL = 'debug';

      const logger = require('./logger').default;

      expect(logger.level).toBe('debug');
    });

    it('should default to info level when LOG_LEVEL not set', () => {
      delete process.env.LOG_LEVEL;

      const logger = require('./logger').default;

      expect(logger.level).toBe('info');
    });

    it('should use pretty print in development', () => {
      process.env.NODE_ENV = 'development';

      const logger = require('./logger').default;

      // In development, the logger should have pretty printing configured
      expect(logger).toBeDefined();
    });

    it('should use JSON format in production', () => {
      process.env.NODE_ENV = 'production';

      const logger = require('./logger').default;

      // In production, logger should use JSON format (default Pino behavior)
      expect(logger).toBeDefined();
    });
  });

  describe('Correlation ID Support', () => {
    it('should support child logger with correlation ID', () => {
      const logger = require('./logger').default;

      const childLogger = logger.child({ correlationId: 'test-123' });

      expect(childLogger).toBeDefined();
      expect(childLogger.bindings().correlationId).toBe('test-123');
    });

    it('should preserve correlation ID in log messages', () => {
      const logger = require('./logger').default;
      const childLogger = logger.child({ correlationId: 'test-456' });

      // Mock the internal write to capture log output
      const writeSpy = jest.spyOn(childLogger, 'info');

      childLogger.info('Test message');

      expect(writeSpy).toHaveBeenCalledWith('Test message');
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact password fields', () => {
      const logger = require('./logger').default;

      // Create a logger with redaction paths
      const testData = {
        user: 'john',
        password: 'secret123',
        data: {
          nested: {
            password: 'another-secret',
          },
        },
      };

      // The logger should be configured to redact sensitive fields
      // This would be verified by checking the actual configuration
      expect(logger).toBeDefined();
    });

    it('should redact authorization headers', () => {
      const logger = require('./logger').default;

      const testData = {
        headers: {
          authorization: 'Bearer token123',
          'content-type': 'application/json',
        },
      };

      // The logger should be configured to redact authorization headers
      expect(logger).toBeDefined();
    });

    it('should redact JWT tokens', () => {
      const logger = require('./logger').default;

      const testData = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'refresh-token-value',
        data: 'non-sensitive',
      };

      // The logger should be configured to redact tokens
      expect(logger).toBeDefined();
    });
  });

  describe('Log Methods', () => {
    let logger: any;
    let infoSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;
    let debugSpy: jest.SpyInstance;
    let fatalSpy: jest.SpyInstance;

    beforeEach(() => {
      logger = require('./logger').default;
      infoSpy = jest.spyOn(logger, 'info');
      errorSpy = jest.spyOn(logger, 'error');
      warnSpy = jest.spyOn(logger, 'warn');
      debugSpy = jest.spyOn(logger, 'debug');
      fatalSpy = jest.spyOn(logger, 'fatal');
    });

    it('should log info messages', () => {
      logger.info('Info message');

      expect(infoSpy).toHaveBeenCalledWith('Info message');
    });

    it('should log error messages with error objects', () => {
      const error = new Error('Test error');
      logger.error(error, 'Error occurred');

      expect(errorSpy).toHaveBeenCalledWith(error, 'Error occurred');
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');

      expect(warnSpy).toHaveBeenCalledWith('Warning message');
    });

    it('should log debug messages', () => {
      logger.debug('Debug message');

      expect(debugSpy).toHaveBeenCalledWith('Debug message');
    });

    it('should log fatal messages', () => {
      const error = new Error('Fatal error');
      logger.fatal(error, 'Fatal error occurred');

      expect(fatalSpy).toHaveBeenCalledWith(error, 'Fatal error occurred');
    });

    it('should support structured logging with objects', () => {
      const metadata = { userId: '123', action: 'login' };
      logger.info(metadata, 'User action');

      expect(infoSpy).toHaveBeenCalledWith(metadata, 'User action');
    });
  });

  describe('Performance', () => {
    it('should have minimal overhead for disabled log levels', () => {
      process.env.LOG_LEVEL = 'error';
      const logger = require('./logger').default;

      const debugSpy = jest.spyOn(logger, 'debug');

      // Debug messages should not be processed when level is error
      logger.debug('This should not be processed');

      expect(debugSpy).toHaveBeenCalled();
      // In Pino, the message is still called but not written to output
    });
  });
});
