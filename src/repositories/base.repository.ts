import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/database/prisma';
import { createChildLogger } from '@common/utils/logger';
import { Logger } from 'pino';

// Type helper to get Prisma model delegate types
type PrismaModelDelegate = {
  [K in Prisma.ModelName]: (typeof prisma)[Uncapitalize<K>];
};

/**
 * Base repository class providing common database operations
 * All repositories should extend this class
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected prisma: PrismaClient;
  protected logger: Logger;
  protected modelName: Prisma.ModelName;

  constructor(modelName: Prisma.ModelName) {
    this.prisma = prisma;
    this.modelName = modelName;
    this.logger = createChildLogger(`repository:${modelName}`);
  }

  /**
   * Get the Prisma model delegate for this repository
   * This provides type-safe access to Prisma model methods
   */
  protected get model() {
    const modelKey = this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1);
    return (this.prisma as any)[modelKey] as PrismaModelDelegate[typeof this.modelName];
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const result = await (this.model as any).findUnique({
        where: { id },
      });
      return result as T | null;
    } catch (error) {
      this.logger.error({ err: error, id }, `Error finding ${this.modelName} by ID`);
      throw error;
    }
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findMany(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<T[]> {
    try {
      const result = await (this.model as any).findMany(params);
      return result as T[];
    } catch (error) {
      this.logger.error({ err: error, params }, `Error finding ${this.modelName} records`);
      throw error;
    }
  }

  /**
   * Count records with optional filtering
   */
  async count(where?: any): Promise<number> {
    try {
      const result = await (this.model as any).count({ where });
      return result;
    } catch (error) {
      this.logger.error({ err: error, where }, `Error counting ${this.modelName} records`);
      throw error;
    }
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<T> {
    try {
      const result = await (this.model as any).create({ data });
      this.logger.info({ id: (result as any).id }, `${this.modelName} created`);
      return result as T;
    } catch (error) {
      this.logger.error({ err: error, data }, `Error creating ${this.modelName}`);
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    try {
      const result = await (this.model as any).update({
        where: { id },
        data,
      });
      this.logger.info({ id }, `${this.modelName} updated`);
      return result as T;
    } catch (error) {
      this.logger.error({ err: error, id, data }, `Error updating ${this.modelName}`);
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    try {
      const result = await (this.model as any).delete({
        where: { id },
      });
      this.logger.info({ id }, `${this.modelName} deleted`);
      return result as T;
    } catch (error) {
      this.logger.error({ err: error, id }, `Error deleting ${this.modelName}`);
      throw error;
    }
  }

  /**
   * Delete multiple records
   */
  async deleteMany(where?: any): Promise<{ count: number }> {
    try {
      const result = await (this.model as any).deleteMany({ where });
      this.logger.info({ count: result.count }, `${this.modelName} records deleted`);
      return result;
    } catch (error) {
      this.logger.error({ err: error, where }, `Error deleting ${this.modelName} records`);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(fn: (tx: any) => Promise<R>): Promise<R> {
    try {
      const result = await this.prisma.$transaction(fn as any);
      return result as R;
    } catch (error) {
      this.logger.error({ err: error }, `Transaction failed for ${this.modelName}`);
      throw error;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(where: any): Promise<boolean> {
    try {
      const count = await this.count(where);
      return count > 0;
    } catch (error) {
      this.logger.error({ err: error, where }, `Error checking existence for ${this.modelName}`);
      throw error;
    }
  }
}
