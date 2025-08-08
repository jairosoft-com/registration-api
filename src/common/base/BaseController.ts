import { Request, Response, NextFunction } from 'express';
import { IComponentController } from '@common/types/component';
import { ApiError } from '@common/utils/ApiError';
import { createChildLogger } from '@common/utils/logger';
import { Logger } from 'pino';

/**
 * Abstract base class for component controllers
 * Provides common controller functionality
 */
export abstract class BaseController implements IComponentController {
  protected readonly logger: Logger;
  protected readonly componentName: string;

  constructor(componentName: string) {
    this.componentName = componentName;
    this.logger = createChildLogger(`controller:${componentName}`);
  }

  /**
   * Optional initialization method
   */
  public async initialize(): Promise<void> {
    this.logger.debug(`Controller initialized: ${this.componentName}`);
  }

  /**
   * Common response handler for successful responses
   */
  protected sendSuccess(
    res: Response,
    data: any,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
    });
  }

  /**
   * Common response handler for paginated responses
   */
  protected sendPaginated(
    res: Response,
    data: any[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): Response {
    return res.status(200).json({
      status: 'success',
      data,
      pagination,
    });
  }

  /**
   * Common error response handler
   */
  protected sendError(res: Response, error: ApiError | Error, statusCode?: number): Response {
    const code = error instanceof ApiError ? error.statusCode : statusCode || 500;

    const message = error.message || 'An error occurred';

    return res.status(code).json({
      status: 'error',
      message,
      statusCode: code,
    });
  }

  /**
   * Async handler wrapper to catch errors
   */
  protected asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Validate required fields in request body
   */
  protected validateRequiredFields(body: any, requiredFields: string[]): void {
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      throw ApiError.badRequest(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Parse pagination parameters from request
   */
  protected parsePagination(req: Request): {
    page: number;
    limit: number;
    skip: number;
  } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Parse sort parameters from request
   */
  protected parseSort(req: Request, allowedFields: string[]): any {
    const sortField = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    if (!sortField || !allowedFields.includes(sortField)) {
      return {};
    }

    return { [sortField]: sortOrder === 'desc' ? -1 : 1 };
  }
}
