import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Directory Structure Compliance', () => {
  const srcPath = path.join(__dirname, '..');

  describe('Component-based architecture', () => {
    it('should have components directory with users and health modules', () => {
      // Assert components directory exists
      const componentsPath = path.join(srcPath, 'components');
      expect(fs.existsSync(componentsPath)).toBe(true);

      // Assert users component exists
      const usersPath = path.join(componentsPath, 'users');
      expect(fs.existsSync(usersPath)).toBe(true);

      // Assert health component exists
      const healthPath = path.join(componentsPath, 'health');
      expect(fs.existsSync(healthPath)).toBe(true);
    });

    it('should have common directory with shared concerns', () => {
      // Assert common directory exists
      const commonPath = path.join(srcPath, 'common');
      expect(fs.existsSync(commonPath)).toBe(true);

      // Assert middleware subdirectory exists
      const middlewarePath = path.join(commonPath, 'middleware');
      expect(fs.existsSync(middlewarePath)).toBe(true);

      // Assert utils subdirectory exists
      const utilsPath = path.join(commonPath, 'utils');
      expect(fs.existsSync(utilsPath)).toBe(true);

      // Assert types subdirectory exists
      const typesPath = path.join(commonPath, 'types');
      expect(fs.existsSync(typesPath)).toBe(true);
    });

    it('should NOT have old api directory structure', () => {
      // Assert old api directory does not exist
      const apiPath = path.join(srcPath, 'api');
      expect(fs.existsSync(apiPath)).toBe(false);
    });

    it('should NOT have middleware directory at root level', () => {
      // Assert old middleware directory does not exist
      const middlewarePath = path.join(srcPath, 'middleware');
      expect(fs.existsSync(middlewarePath)).toBe(false);
    });

    it('should NOT have utils directory at root level', () => {
      // Assert old utils directory does not exist
      const utilsPath = path.join(srcPath, 'utils');
      expect(fs.existsSync(utilsPath)).toBe(false);
    });

    it('should NOT have types directory at root level', () => {
      // Assert old types directory does not exist
      const typesPath = path.join(srcPath, 'types');
      expect(fs.existsSync(typesPath)).toBe(false);
    });
  });

  describe('File naming conventions', () => {
    it('should use plural naming for user module files', () => {
      const usersPath = path.join(srcPath, 'components', 'users');

      // Assert plural file names exist
      expect(fs.existsSync(path.join(usersPath, 'users.controller.ts'))).toBe(true);
      expect(fs.existsSync(path.join(usersPath, 'users.service.ts'))).toBe(true);
      expect(fs.existsSync(path.join(usersPath, 'users.routes.ts'))).toBe(true);
      expect(fs.existsSync(path.join(usersPath, 'users.types.ts'))).toBe(true);
      expect(fs.existsSync(path.join(usersPath, 'users.validation.ts'))).toBe(true);

      // Assert singular file names do NOT exist
      expect(fs.existsSync(path.join(usersPath, 'user.controller.ts'))).toBe(false);
      expect(fs.existsSync(path.join(usersPath, 'user.service.ts'))).toBe(false);
      expect(fs.existsSync(path.join(usersPath, 'user.routes.ts'))).toBe(false);
      expect(fs.existsSync(path.join(usersPath, 'user.types.ts'))).toBe(false);
      expect(fs.existsSync(path.join(usersPath, 'user.validation.ts'))).toBe(false);
    });

    it('should have test files co-located with components', () => {
      const usersPath = path.join(srcPath, 'components', 'users');

      // Assert test files exist in component directory
      expect(fs.existsSync(path.join(usersPath, 'users.controller.spec.ts'))).toBe(true);
      expect(fs.existsSync(path.join(usersPath, 'users.service.spec.ts'))).toBe(true);
    });
  });

  describe('Import path verification', () => {
    it('should be able to import from new paths', () => {
      // Test importing from components
      const usersController = require('../components/users/users.controller');
      expect(usersController).toBeDefined();
      expect(usersController.registerUser).toBeDefined();
      expect(usersController.loginUser).toBeDefined();

      // Test importing from common/utils
      const ApiError = require('../common/utils/ApiError');
      expect(ApiError.ApiError).toBeDefined();

      // Test importing from common/middleware
      const errorMiddleware = require('../common/middleware/error.middleware');
      expect(errorMiddleware.errorMiddleware).toBeDefined();
    });
  });
});
