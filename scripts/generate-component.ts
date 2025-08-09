#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

/**
 * Component Generator Script
 * Generates boilerplate code for new components following established patterns
 *
 * Usage: npm run generate:component <component-name>
 * Example: npm run generate:component products
 */

// Helpers for safe naming across files, routes, and identifiers
function splitWords(input: string): string[] {
  // Split by non-alphanumeric boundaries and case transitions
  const cleaned = input
    .replace(/[^a-zA-Z0-9]+/g, ' ') // non-alphanum to space
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // fooBar -> foo Bar
    .trim();
  return cleaned.split(/\s+/).filter(Boolean);
}

function toKebabCase(input: string): string {
  return splitWords(input)
    .map((w) => w.toLowerCase())
    .join('-');
}

function toPascalCase(input: string): string {
  const result = splitWords(input)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  // Ensure identifier doesn't start with a digit
  return /^[0-9]/.test(result) ? `X${result}` : result;
}

function toCamelCase(input: string): string {
  const pascal = toPascalCase(input);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function ensurePluralKebab(kebab: string): string {
  return kebab.endsWith('s') ? kebab : `${kebab}s`;
}

function ensureSingularKebab(kebabPlural: string): string {
  return kebabPlural.endsWith('s') ? kebabPlural.slice(0, -1) : kebabPlural;
}

// Get and validate component name from CLI
const rawInputName = process.argv[2];

if (!rawInputName) {
  console.error('❌ Please provide a component name');
  console.log('Usage: npm run generate:component <component-name>');
  console.log('Example: npm run generate:component products');
  process.exit(1);
}

// Guard against obviously bad/suspicious names (e.g., timestamp-based)
const suspiciousPattern = /^test-component-\d+s$/i;
if (suspiciousPattern.test(rawInputName) || /^\d+$/.test(rawInputName)) {
  console.error(
    `❌ Invalid component name '${rawInputName}'. Avoid timestamp-like or auto-generated names.`
  );
  process.exit(1);
}

// Derive safe names
const kebabBase = toKebabCase(rawInputName);
if (!/^[a-z][a-z0-9-]*$/.test(kebabBase)) {
  console.error(
    `❌ Invalid component name '${rawInputName}'. Use letters/numbers; separators allowed: '-'`
  );
  process.exit(1);
}

const pluralKebab = ensurePluralKebab(kebabBase);
const singularKebab = ensureSingularKebab(pluralKebab);

const PascalSingular = toPascalCase(singularKebab);
const PascalPlural = toPascalCase(pluralKebab);
const camelSingular = toCamelCase(singularKebab);
const camelPlural = toCamelCase(pluralKebab);

// Define paths
const componentPath = path.join(process.cwd(), 'src', 'components', pluralKebab);

// Check if component already exists
if (fs.existsSync(componentPath)) {
  console.error(`❌ Component '${pluralKebab}' already exists`);
  process.exit(1);
}

// Create component directory
fs.mkdirSync(componentPath, { recursive: true });

// Template files
const templates = {
  controller: `import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@common/base/BaseController';
import { ${camelSingular}Service } from './${pluralKebab}.service';
import { Create${PascalSingular}Input, Update${PascalSingular}Input } from './${pluralKebab}.types';

/**
 * ${PascalPlural} Controller
 * Handles HTTP requests for ${pluralKebab} operations
 */
export class ${PascalPlural}Controller extends BaseController {
  constructor() {
    super('${pluralKebab}');
  }

  /**
   * Get all ${pluralKebab}
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10, skip = 0 } = req.query as any;
      const result = await ${camelSingular}Service.getAll(Number(limit), Number(skip));
      this.sendSuccess(res, result, 'Retrieved ${pluralKebab} successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ${singularKebab} by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ${camelSingular}Service.getById(id);
      this.sendSuccess(res, result, '${PascalSingular} retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new ${singularKebab}
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: Create${PascalSingular}Input = req.body;
      const result = await ${camelSingular}Service.create(data);
      this.sendSuccess(res, result, '${PascalSingular} created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ${singularKebab}
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: Update${PascalSingular}Input = req.body;
      const result = await ${camelSingular}Service.update(id, data);
      this.sendSuccess(res, result, '${PascalSingular} updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ${singularKebab}
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await ${camelSingular}Service.delete(id);
      this.sendSuccess(res, null, '${PascalSingular} deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const ${camelPlural}Controller = new ${PascalPlural}Controller();
`,

  service: `import { BaseService } from '@common/base/BaseService';
import { ApiError } from '@common/utils/ApiError';
import { Create${PascalSingular}Input, Update${PascalSingular}Input, ${PascalSingular}Data } from './${pluralKebab}.types';

/**
 * ${PascalPlural} Service
 * Handles business logic for ${pluralKebab} operations
 */
export class ${PascalPlural}Service extends BaseService {
  constructor() {
    super('${pluralKebab}');
  }

  /**
   * Get all ${pluralKebab}
   */
  async getAll(limit: number = 10, skip: number = 0): Promise<{ ${pluralKebab}: ${PascalSingular}Data[]; total: number }> {
    // TODO: Implement database query
    this.logger.info({ limit, skip }, 'Fetching ${pluralKebab}');
    return {
      ${pluralKebab}: [],
      total: 0,
    };
  }

  /**
   * Get ${singularKebab} by ID
   */
  async getById(id: string): Promise<${PascalSingular}Data> {
    // TODO: Implement database query
    this.logger.info({ id }, 'Fetching ${singularKebab}');
    throw ApiError.notFound('${PascalSingular} not found');
  }

  /**
   * Create new ${singularKebab}
   */
  async create(data: Create${PascalSingular}Input): Promise<${PascalSingular}Data> {
    // TODO: Implement database creation
    this.logger.info({ data }, 'Creating ${singularKebab}');
    return {
      id: 'generated-id',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ${PascalSingular}Data;
  }

  /**
   * Update ${singularKebab}
   */
  async update(id: string, data: Update${PascalSingular}Input): Promise<${PascalSingular}Data> {
    // TODO: Implement database update
    this.logger.info({ id, data }, 'Updating ${singularKebab}');
    throw ApiError.notFound('${PascalSingular} not found');
  }

  /**
   * Delete ${singularKebab}
   */
  async delete(id: string): Promise<void> {
    // TODO: Implement database deletion
    this.logger.info({ id }, 'Deleting ${singularKebab}');
    throw ApiError.notFound('${PascalSingular} not found');
  }
}

// Export singleton instance
export const ${camelSingular}Service = new ${PascalPlural}Service();
`,

  routes: `import { Router } from 'express';
import { ${camelPlural}Controller } from './${pluralKebab}.controller';
import { validate } from '@common/middleware/validation.middleware';
import { authMiddleware } from '@common/middleware/auth.middleware';
import { Create${PascalSingular}Schema, Update${PascalSingular}Schema, GetAll${PascalPlural}Schema } from './${pluralKebab}.validation';

const router = Router();

/**
 * @swagger
 * /api/v1/${pluralKebab}:
 *   get:
 *     summary: Get all ${pluralKebab}
 *     tags: [${PascalPlural}]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of ${pluralKebab}
 */
router.get('/', validate(GetAll${PascalPlural}Schema), ${camelPlural}Controller.getAll.bind(${camelPlural}Controller));

/**
 * @swagger
 * /api/v1/${pluralKebab}/{id}:
 *   get:
 *     summary: Get ${singularKebab} by ID
 *     tags: [${PascalPlural}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ${PascalSingular} details
 *       404:
 *         description: ${PascalSingular} not found
 */
router.get('/:id', ${camelPlural}Controller.getById.bind(${camelPlural}Controller));

/**
 * @swagger
 * /api/v1/${pluralKebab}:
 *   post:
 *     summary: Create new ${singularKebab}
 *     tags: [${PascalPlural}]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Create${PascalSingular}'
 *     responses:
 *       201:
 *         description: ${PascalSingular} created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', authMiddleware, validate(Create${PascalSingular}Schema), ${camelPlural}Controller.create.bind(${camelPlural}Controller));

/**
 * @swagger
 * /api/v1/${pluralKebab}/{id}:
 *   put:
 *     summary: Update ${singularKebab}
 *     tags: [${PascalPlural}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Update${PascalSingular}'
 *     responses:
 *       200:
 *         description: ${PascalSingular} updated successfully
 *       404:
 *         description: ${PascalSingular} not found
 */
router.put('/:id', authMiddleware, validate(Update${PascalSingular}Schema), ${camelPlural}Controller.update.bind(${camelPlural}Controller));

/**
 * @swagger
 * /api/v1/${pluralKebab}/{id}:
 *   delete:
 *     summary: Delete ${singularKebab}
 *     tags: [${PascalPlural}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ${PascalSingular} deleted successfully
 *       404:
 *         description: ${PascalSingular} not found
 */
router.delete('/:id', authMiddleware, ${camelPlural}Controller.delete.bind(${camelPlural}Controller));

export default router;
`,

  validation: `import { z } from 'zod';

/**
 * ${PascalPlural} Validation Schemas
 */

export const Create${PascalSingular}Schema = z.object({
  body: z.object({
    // TODO: Add validation fields
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  }),
});

export const Update${PascalSingular}Schema = z.object({
  body: z.object({
    // TODO: Add validation fields
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const GetAll${PascalPlural}Schema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional(),
    skip: z.coerce.number().min(0).optional(),
  }),
});
`,

  types: `import { z } from 'zod';
import { Create${PascalSingular}Schema, Update${PascalSingular}Schema } from './${pluralKebab}.validation';

/**
 * ${PascalPlural} Type Definitions
 */

// Infer types from Zod schemas
export type Create${PascalSingular}Input = z.infer<typeof Create${PascalSingular}Schema>['body'];
export type Update${PascalSingular}Input = z.infer<typeof Update${PascalSingular}Schema>['body'];

// Data model
export interface ${PascalSingular}Data {
  id: string;
  // TODO: Add data fields
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
`,

  index: `import { BaseComponent } from '@common/base/BaseComponent';
import router from './${pluralKebab}.routes';
import { ${camelPlural}Controller } from './${pluralKebab}.controller';
import { ${camelSingular}Service } from './${pluralKebab}.service';

/**
 * ${PascalPlural} Component
 */
class ${PascalPlural}Component extends BaseComponent {
  constructor() {
    super({
      name: '${pluralKebab}',
      version: '1.0.0',
      basePath: '/${pluralKebab}',
      router,
    });
  }

  protected initializeRoutes(): void {
    // Routes are defined in ${pluralKebab}.routes.ts
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.logger.info('${PascalPlural} component initialized');
  }
}

// Export component instance
export const ${camelPlural}Component = new ${PascalPlural}Component();
export default ${camelPlural}Component;

// Re-export for convenience
export { router };
export { ${camelPlural}Controller };
export { ${camelSingular}Service };
`,

  test: `import request from 'supertest';
import express from 'express';
import { ${camelPlural}Controller } from './${pluralKebab}.controller';
import { ${camelSingular}Service } from './${pluralKebab}.service';
import { ApiError } from '@common/utils/ApiError';

// Mock the service
jest.mock('./${pluralKebab}.service');

describe('${PascalPlural} Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup test routes
    app.get('/${pluralKebab}', ${camelPlural}Controller.getAll.bind(${camelPlural}Controller));
    app.get('/${pluralKebab}/:id', ${camelPlural}Controller.getById.bind(${camelPlural}Controller));
    app.post('/${pluralKebab}', ${camelPlural}Controller.create.bind(${camelPlural}Controller));
    app.put('/${pluralKebab}/:id', ${camelPlural}Controller.update.bind(${camelPlural}Controller));
    app.delete('/${pluralKebab}/:id', ${camelPlural}Controller.delete.bind(${camelPlural}Controller));
    
    // Add error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ error: err.message });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /${pluralKebab}', () => {
    it('should return all ${pluralName}', async () => {
      const mockData = { ${pluralKebab}: [], total: 0 };
      (${camelSingular}Service.getAll as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app)
        .get('/${pluralKebab}')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });
  });

  describe('GET /${pluralKebab}/:id', () => {
    it('should return ${singularName} by ID', async () => {
      const mock${PascalSingular} = { id: '123', name: 'Test' };
      (${camelSingular}Service.getById as jest.Mock).mockResolvedValue(mock${PascalSingular});

      const response = await request(app)
        .get('/${pluralKebab}/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mock${PascalSingular});
    });

    it('should return 404 if ${singularName} not found', async () => {
      (${camelSingular}Service.getById as jest.Mock).mockRejectedValue(ApiError.notFound('${PascalSingular} not found'));

      await request(app)
        .get('/${pluralKebab}/999')
        .expect(404);
    });
  });

  describe('POST /${pluralKebab}', () => {
    it('should create new ${singularName}', async () => {
      const newData = { name: 'New ${capitalizedSingular}' };
      const created = { id: '123', ...newData };
      (${camelSingular}Service.create as jest.Mock).mockResolvedValue(created);

      const response = await request(app)
        .post('/${pluralKebab}')
        .send(newData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(created);
    });
  });

  describe('PUT /${pluralKebab}/:id', () => {
    it('should update ${singularName}', async () => {
      const updateData = { name: 'Updated' };
      const updated = { id: '123', ...updateData };
      (${camelSingular}Service.update as jest.Mock).mockResolvedValue(updated);

      const response = await request(app)
        .put('/${pluralKebab}/123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updated);
    });
  });

  describe('DELETE /${pluralKebab}/:id', () => {
    it('should delete ${singularName}', async () => {
      (${camelSingular}Service.delete as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/${pluralKebab}/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('${capitalizedSingular} deleted successfully');
    });
  });
});
`,
};

// Write files
console.log(`\n🚀 Generating component: ${pluralKebab}`);

Object.entries(templates).forEach(([filename, content]) => {
  const extension = filename === 'test' ? 'spec.ts' : 'ts';
  const fileName = filename === 'index' ? 'index' : `${pluralKebab}.${filename}`;
  const filePath = path.join(componentPath, `${fileName}.${extension}`);

  fs.writeFileSync(filePath, content);
  console.log(`   ✅ Created ${fileName}.${extension}`);
});

console.log(`\n✨ Component '${pluralKebab}' generated successfully!`);
console.log(`📁 Location: ${componentPath}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Update the validation schemas in ${pluralKebab}.validation.ts`);
console.log(`   2. Implement the service methods in ${pluralKebab}.service.ts`);
console.log(`   3. Add the component to your app router`);
console.log(`   4. Run tests: npm test -- ${pluralKebab}`);
