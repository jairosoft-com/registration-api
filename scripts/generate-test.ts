#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

/**
 * Test Generator Script
 * Generates test file templates for existing code files
 *
 * Usage: npm run generate:test <file-path>
 * Example: npm run generate:test src/services/example.service.ts
 */

// Get file path from command line arguments
const targetFile = process.argv[2];

if (!targetFile) {
  console.error('❌ Please provide a file path to generate tests for');
  console.log('Usage: npm run generate:test <file-path>');
  console.log('Example: npm run generate:test src/services/example.service.ts');
  process.exit(1);
}

// Resolve full path
const fullPath = path.resolve(process.cwd(), targetFile);

// Check if file exists
if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${targetFile}`);
  process.exit(1);
}

// Check if it's a TypeScript file
if (!fullPath.endsWith('.ts') || fullPath.endsWith('.spec.ts') || fullPath.endsWith('.test.ts')) {
  console.error('❌ Please provide a TypeScript file (not a test file)');
  process.exit(1);
}

// Generate test file path
const dir = path.dirname(fullPath);
const basename = path.basename(fullPath, '.ts');
const testFilePath = path.join(dir, `${basename}.spec.ts`);

// Check if test file already exists
if (fs.existsSync(testFilePath)) {
  console.error(`❌ Test file already exists: ${testFilePath}`);
  process.exit(1);
}

// Read the source file to understand its structure
const sourceCode = fs.readFileSync(fullPath, 'utf-8');

// Detect file type based on naming and content
const isController = basename.includes('controller');
const isService = basename.includes('service');
const isMiddleware = basename.includes('middleware');
const isUtil = basename.includes('util') || dir.includes('utils');
const isRepository = basename.includes('repository');

// Extract class/function names from the source
const classMatch = sourceCode.match(/export\s+class\s+(\w+)/);
const functionMatches = sourceCode.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
const constFunctionMatches = sourceCode.matchAll(/export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g);

const className = classMatch ? classMatch[1] : null;
const exportedFunctions = [
  ...Array.from(functionMatches).map((m) => m[1]),
  ...Array.from(constFunctionMatches).map((m) => m[1]),
];

// Generate appropriate test template
let testTemplate = '';

if (isController) {
  testTemplate = generateControllerTest(basename, className);
} else if (isService) {
  testTemplate = generateServiceTest(basename, className);
} else if (isMiddleware) {
  testTemplate = generateMiddlewareTest(basename, exportedFunctions);
} else if (isRepository) {
  testTemplate = generateRepositoryTest(basename, className);
} else if (isUtil) {
  testTemplate = generateUtilTest(basename, exportedFunctions);
} else if (className) {
  testTemplate = generateClassTest(basename, className);
} else if (exportedFunctions.length > 0) {
  testTemplate = generateFunctionTest(basename, exportedFunctions);
} else {
  testTemplate = generateGenericTest(basename);
}

// Write test file
fs.writeFileSync(testFilePath, testTemplate);

console.log(`✅ Test file generated: ${testFilePath}`);
console.log('\n📝 Next steps:');
console.log('   1. Review and update the generated test cases');
console.log('   2. Add specific test scenarios for your business logic');
console.log('   3. Run the tests: npm test');

// Template generation functions
function generateControllerTest(filename: string, className: string | null): string {
  const name = className || filename.replace('.controller', '');
  return `import request from 'supertest';
import express from 'express';
import { ${name} } from './${filename}';

describe('${name}', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // TODO: Setup routes
    // app.get('/test', controller.method);
    
    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ error: err.message });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /endpoint', () => {
    it('should return success response', async () => {
      const response = await request(app)
        .get('/endpoint')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should handle errors', async () => {
      // TODO: Mock error scenario
      
      await request(app)
        .get('/endpoint')
        .expect(500);
    });
  });

  // TODO: Add more test cases
});
`;
}

function generateServiceTest(filename: string, className: string | null): string {
  const name = className || filename.replace('.service', '');
  return `import { ${name} } from './${filename}';

// Mock dependencies
jest.mock('@/database/repositories/repository');

describe('${name}', () => {
  let service: ${name};

  beforeEach(() => {
    service = new ${name}();
    jest.clearAllMocks();
  });

  describe('method', () => {
    it('should perform expected operation', async () => {
      // Arrange
      const input = { /* test data */ };
      const expected = { /* expected result */ };
      
      // Act
      const result = await service.method(input);
      
      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle errors appropriately', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Mock error
      jest.spyOn(service as any, 'dependency').mockRejectedValue(new Error('Test error'));
      
      // Act & Assert
      await expect(service.method(input)).rejects.toThrow('Test error');
    });
  });

  // TODO: Add more test cases for other methods
});
`;
}

function generateMiddlewareTest(filename: string, functions: string[]): string {
  const mainFunction = functions[0] || 'middleware';
  return `import { Request, Response, NextFunction } from 'express';
import { ${functions.join(', ')} } from './${filename}';

describe('${filename}', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      body: {},
      params: {},
      query: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    
    next = jest.fn();
  });

  describe('${mainFunction}', () => {
    it('should call next() on successful validation', () => {
      // Arrange
      req.body = { /* valid data */ };
      
      // Act
      ${mainFunction}(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('should return error on invalid input', () => {
      // Arrange
      req.body = { /* invalid data */ };
      
      // Act
      ${mainFunction}(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // TODO: Add more test cases
});
`;
}

function generateRepositoryTest(filename: string, className: string | null): string {
  const name = className || filename.replace('.repository', '');
  return `import { ${name} } from './${filename}';

// Mock database
jest.mock('@/database/prisma');

describe('${name}', () => {
  let repository: ${name};

  beforeEach(() => {
    repository = new ${name}();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return entity by ID', async () => {
      // Arrange
      const id = 'test-id';
      const mockEntity = { id, /* other fields */ };
      
      // Mock database response
      (repository as any).prisma.model.findUnique = jest.fn().mockResolvedValue(mockEntity);
      
      // Act
      const result = await repository.findById(id);
      
      // Assert
      expect(result).toEqual(mockEntity);
    });

    it('should return null if entity not found', async () => {
      // Arrange
      const id = 'non-existent';
      
      // Mock database response
      (repository as any).prisma.model.findUnique = jest.fn().mockResolvedValue(null);
      
      // Act
      const result = await repository.findById(id);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  // TODO: Add more test cases for other methods
});
`;
}

function generateUtilTest(filename: string, functions: string[]): string {
  const imports = functions.length > 0 ? functions.join(', ') : '*';
  return `import { ${imports} } from './${filename}';

describe('${filename}', () => {
${functions
  .map(
    (fn) => `
  describe('${fn}', () => {
    it('should work correctly with valid input', () => {
      // Arrange
      const input = /* test input */;
      const expected = /* expected output */;
      
      // Act
      const result = ${fn}(input);
      
      // Assert
      expect(result).toEqual(expected);
    });

    it('should handle edge cases', () => {
      // Test with null/undefined
      expect(${fn}(null)).toBe(/* expected */);
      expect(${fn}(undefined)).toBe(/* expected */);
      
      // Test with empty values
      expect(${fn}('')).toBe(/* expected */);
      expect(${fn}([])).toBe(/* expected */);
    });
  });
`
  )
  .join('\n')}

  // TODO: Add more specific test cases
});
`;
}

function generateClassTest(filename: string, className: string): string {
  return `import { ${className} } from './${filename}';

describe('${className}', () => {
  let instance: ${className};

  beforeEach(() => {
    instance = new ${className}();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      expect(instance).toBeInstanceOf(${className});
    });
  });

  describe('methods', () => {
    // TODO: Add tests for each public method
    it('should have tests for public methods', () => {
      expect(true).toBe(true);
    });
  });

  // TODO: Add more specific test cases
});
`;
}

function generateFunctionTest(filename: string, functions: string[]): string {
  const imports = functions.join(', ');
  return `import { ${imports} } from './${filename}';

describe('${filename}', () => {
${functions
  .map(
    (fn) => `
  describe('${fn}', () => {
    it('should work correctly', () => {
      // TODO: Add test implementation
      expect(true).toBe(true);
    });
  });
`
  )
  .join('\n')}

  // TODO: Add more specific test cases
});
`;
}

function generateGenericTest(filename: string): string {
  return `import * as module from './${filename}';

describe('${filename}', () => {
  it('should export expected items', () => {
    expect(module).toBeDefined();
  });

  // TODO: Add specific test cases based on the module's functionality
});
`;
}
