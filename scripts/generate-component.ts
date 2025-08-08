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

// Get component name from command line arguments
const componentName = process.argv[2];

if (!componentName) {
  console.error('❌ Please provide a component name');
  console.log('Usage: npm run generate:component <component-name>');
  console.log('Example: npm run generate:component products');
  process.exit(1);
}

// Ensure component name is lowercase and plural
const normalizedName = componentName.toLowerCase();
const pluralName = normalizedName.endsWith('s') ? normalizedName : `${normalizedName}s`;
const singularName = pluralName.endsWith('s') ? pluralName.slice(0, -1) : pluralName;
const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);
const capitalizedPlural = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);

// Define paths
const componentPath = path.join(process.cwd(), 'src', 'components', pluralName);

// Check if component already exists
if (fs.existsSync(componentPath)) {
  console.error(`❌ Component '${pluralName}' already exists`);
  process.exit(1);
}

// Create component directory
fs.mkdirSync(componentPath, { recursive: true });

// Template files
const templates = {
  controller: `import { Request, Response, NextFunction } from 'express';
import { BaseController } from '@common/base/BaseController';
import { ${singularName}Service } from './${pluralName}.service';
import { Create${capitalizedSingular}Input, Update${capitalizedSingular}Input } from './${pluralName}.types';

/**
 * ${capitalizedPlural} Controller
 * Handles HTTP requests for ${pluralName} operations
 */
export class ${capitalizedPlural}Controller extends BaseController {
  constructor() {
    super('${pluralName}');
  }

  /**
   * Get all ${pluralName}
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = 10, skip = 0 } = req.query;
      const result = await ${singularName}Service.getAll(Number(limit), Number(skip));
      
      this.sendSuccess(res, result, 'Retrieved ${pluralName} successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ${singularName} by ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ${singularName}Service.getById(id);
      
      this.sendSuccess(res, result, '${capitalizedSingular} retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new ${singularName}
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: Create${capitalizedSingular}Input = req.body;
      const result = await ${singularName}Service.create(data);
      
      this.sendSuccess(res, result, '${capitalizedSingular} created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ${singularName}
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data: Update${capitalizedSingular}Input = req.body;
      const result = await ${singularName}Service.update(id, data);
      
      this.sendSuccess(res, result, '${capitalizedSingular} updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ${singularName}
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await ${singularName}Service.delete(id);
      
      this.sendSuccess(res, null, '${capitalizedSingular} deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const ${pluralName}Controller = new ${capitalizedPlural}Controller();
`,

  service: `import { BaseService } from '@common/base/BaseService';
import { ApiError } from '@common/utils/ApiError';
import { Create${capitalizedSingular}Input, Update${capitalizedSingular}Input, ${capitalizedSingular}Data } from './${pluralName}.types';

/**
 * ${capitalizedPlural} Service
 * Handles business logic for ${pluralName} operations
 */
export class ${capitalizedPlural}Service extends BaseService {
  constructor() {
    super('${pluralName}');
  }

  /**
   * Get all ${pluralName}
   */
  async getAll(limit: number = 10, skip: number = 0): Promise<{ ${pluralName}: ${capitalizedSingular}Data[]; total: number }> {
    // TODO: Implement database query
    this.logger.info({ limit, skip }, 'Fetching ${pluralName}');
    
    return {
      ${pluralName}: [],
      total: 0,
    };
  }

  /**
   * Get ${singularName} by ID
   */
  async getById(id: string): Promise<${capitalizedSingular}Data> {
    // TODO: Implement database query
    this.logger.info({ id }, 'Fetching ${singularName}');
    
    throw ApiError.notFound('${capitalizedSingular} not found');
  }

  /**
   * Create new ${singularName}
   */
  async create(data: Create${capitalizedSingular}Input): Promise<${capitalizedSingular}Data> {
    // TODO: Implement database creation
    this.logger.info({ data }, 'Creating ${singularName}');
    
    return {
      id: 'generated-id',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ${capitalizedSingular}Data;
  }

  /**
   * Update ${singularName}
   */
  async update(id: string, data: Update${capitalizedSingular}Input): Promise<${capitalizedSingular}Data> {
    // TODO: Implement database update
    this.logger.info({ id, data }, 'Updating ${singularName}');
    
    throw ApiError.notFound('${capitalizedSingular} not found');
  }

  /**
   * Delete ${singularName}
   */
  async delete(id: string): Promise<void> {
    // TODO: Implement database deletion
    this.logger.info({ id }, 'Deleting ${singularName}');
    
    throw ApiError.notFound('${capitalizedSingular} not found');
  }
}

// Export singleton instance
export const ${singularName}Service = new ${capitalizedPlural}Service();
`,

  routes: `import { Router } from 'express';
import { ${pluralName}Controller } from './${pluralName}.controller';
import { validate } from '@common/middleware/validate.middleware';
import { authMiddleware } from '@common/middleware/auth.middleware';
import { Create${capitalizedSingular}Schema, Update${capitalizedSingular}Schema, GetAll${capitalizedPlural}Schema } from './${pluralName}.validation';

const router = Router();

/**
 * @swagger
 * /api/v1/${pluralName}:
 *   get:
 *     summary: Get all ${pluralName}
 *     tags: [${capitalizedPlural}]
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
 *         description: List of ${pluralName}
 */
router.get(
  '/',
  validate(GetAll${capitalizedPlural}Schema),
  ${pluralName}Controller.getAll.bind(${pluralName}Controller)
);

/**
 * @swagger
 * /api/v1/${pluralName}/{id}:
 *   get:
 *     summary: Get ${singularName} by ID
 *     tags: [${capitalizedPlural}]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: ${capitalizedSingular} details
 *       404:
 *         description: ${capitalizedSingular} not found
 */
router.get('/:id', ${pluralName}Controller.getById.bind(${pluralName}Controller));

/**
 * @swagger
 * /api/v1/${pluralName}:
 *   post:
 *     summary: Create new ${singularName}
 *     tags: [${capitalizedPlural}]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Create${capitalizedSingular}'
 *     responses:
 *       201:
 *         description: ${capitalizedSingular} created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authMiddleware,
  validate(Create${capitalizedSingular}Schema),
  ${pluralName}Controller.create.bind(${pluralName}Controller)
);

/**
 * @swagger
 * /api/v1/${pluralName}/{id}:
 *   put:
 *     summary: Update ${singularName}
 *     tags: [${capitalizedPlural}]
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
 *             $ref: '#/components/schemas/Update${capitalizedSingular}'
 *     responses:
 *       200:
 *         description: ${capitalizedSingular} updated successfully
 *       404:
 *         description: ${capitalizedSingular} not found
 */
router.put(
  '/:id',
  authMiddleware,
  validate(Update${capitalizedSingular}Schema),
  ${pluralName}Controller.update.bind(${pluralName}Controller)
);

/**
 * @swagger
 * /api/v1/${pluralName}/{id}:
 *   delete:
 *     summary: Delete ${singularName}
 *     tags: [${capitalizedPlural}]
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
 *         description: ${capitalizedSingular} deleted successfully
 *       404:
 *         description: ${capitalizedSingular} not found
 */
router.delete(
  '/:id',
  authMiddleware,
  ${pluralName}Controller.delete.bind(${pluralName}Controller)
);

export default router;
`,

  validation: `import { z } from 'zod';

/**
 * ${capitalizedPlural} Validation Schemas
 */

export const Create${capitalizedSingular}Schema = z.object({
  body: z.object({
    // TODO: Add validation fields
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
  }),
});

export const Update${capitalizedSingular}Schema = z.object({
  body: z.object({
    // TODO: Add validation fields
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export const GetAll${capitalizedPlural}Schema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).optional(),
    skip: z.coerce.number().min(0).optional(),
  }),
});
`,

  types: `import { z } from 'zod';
import { Create${capitalizedSingular}Schema, Update${capitalizedSingular}Schema } from './${pluralName}.validation';

/**
 * ${capitalizedPlural} Type Definitions
 */

// Infer types from Zod schemas
export type Create${capitalizedSingular}Input = z.infer<typeof Create${capitalizedSingular}Schema>['body'];
export type Update${capitalizedSingular}Input = z.infer<typeof Update${capitalizedSingular}Schema>['body'];

// Data model
export interface ${capitalizedSingular}Data {
  id: string;
  // TODO: Add data fields
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
`,

  index: `import { BaseComponent } from '@common/base/BaseComponent';
import router from './${pluralName}.routes';
import { ${pluralName}Controller } from './${pluralName}.controller';
import { ${singularName}Service } from './${pluralName}.service';

/**
 * ${capitalizedPlural} Component
 */
class ${capitalizedPlural}Component extends BaseComponent {
  constructor() {
    super({
      name: '${pluralName}',
      version: '1.0.0',
      basePath: '/${pluralName}',
      router,
    });
  }

  protected initializeRoutes(): void {
    // Routes are defined in ${pluralName}.routes.ts
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.logger.info('${capitalizedPlural} component initialized');
  }
}

// Export component instance
export const ${pluralName}Component = new ${capitalizedPlural}Component();
export default ${pluralName}Component;

// Re-export for convenience
export { router };
export { ${pluralName}Controller };
export { ${singularName}Service };
`,

  test: `import request from 'supertest';
import express from 'express';
import { ${pluralName}Controller } from './${pluralName}.controller';
import { ${singularName}Service } from './${pluralName}.service';
import { ApiError } from '@common/utils/ApiError';

// Mock the service
jest.mock('./${pluralName}.service');

describe('${capitalizedPlural} Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup test routes
    app.get('/${pluralName}', ${pluralName}Controller.getAll.bind(${pluralName}Controller));
    app.get('/${pluralName}/:id', ${pluralName}Controller.getById.bind(${pluralName}Controller));
    app.post('/${pluralName}', ${pluralName}Controller.create.bind(${pluralName}Controller));
    app.put('/${pluralName}/:id', ${pluralName}Controller.update.bind(${pluralName}Controller));
    app.delete('/${pluralName}/:id', ${pluralName}Controller.delete.bind(${pluralName}Controller));
    
    // Add error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ error: err.message });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /${pluralName}', () => {
    it('should return all ${pluralName}', async () => {
      const mockData = { ${pluralName}: [], total: 0 };
      (${singularName}Service.getAll as jest.Mock).mockResolvedValue(mockData);

      const response = await request(app)
        .get('/${pluralName}')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockData);
    });
  });

  describe('GET /${pluralName}/:id', () => {
    it('should return ${singularName} by ID', async () => {
      const mock${capitalizedSingular} = { id: '123', name: 'Test' };
      (${singularName}Service.getById as jest.Mock).mockResolvedValue(mock${capitalizedSingular});

      const response = await request(app)
        .get('/${pluralName}/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mock${capitalizedSingular});
    });

    it('should return 404 if ${singularName} not found', async () => {
      (${singularName}Service.getById as jest.Mock).mockRejectedValue(ApiError.notFound('${capitalizedSingular} not found'));

      await request(app)
        .get('/${pluralName}/999')
        .expect(404);
    });
  });

  describe('POST /${pluralName}', () => {
    it('should create new ${singularName}', async () => {
      const newData = { name: 'New ${capitalizedSingular}' };
      const created = { id: '123', ...newData };
      (${singularName}Service.create as jest.Mock).mockResolvedValue(created);

      const response = await request(app)
        .post('/${pluralName}')
        .send(newData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(created);
    });
  });

  describe('PUT /${pluralName}/:id', () => {
    it('should update ${singularName}', async () => {
      const updateData = { name: 'Updated' };
      const updated = { id: '123', ...updateData };
      (${singularName}Service.update as jest.Mock).mockResolvedValue(updated);

      const response = await request(app)
        .put('/${pluralName}/123')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updated);
    });
  });

  describe('DELETE /${pluralName}/:id', () => {
    it('should delete ${singularName}', async () => {
      (${singularName}Service.delete as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/${pluralName}/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('${capitalizedSingular} deleted successfully');
    });
  });
});
`,
};

// Write files
console.log(`\n🚀 Generating component: ${pluralName}`);

Object.entries(templates).forEach(([filename, content]) => {
  const extension = filename === 'test' ? 'spec.ts' : 'ts';
  const fileName = filename === 'index' ? 'index' : `${pluralName}.${filename}`;
  const filePath = path.join(componentPath, `${fileName}.${extension}`);

  fs.writeFileSync(filePath, content);
  console.log(`   ✅ Created ${fileName}.${extension}`);
});

console.log(`\n✨ Component '${pluralName}' generated successfully!`);
console.log(`📁 Location: ${componentPath}`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Update the validation schemas in ${pluralName}.validation.ts`);
console.log(`   2. Implement the service methods in ${pluralName}.service.ts`);
console.log(`   3. Add the component to your app router`);
console.log(`   4. Run tests: npm test -- ${pluralName}`);
