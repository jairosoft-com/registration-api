import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '@common/utils/ApiError';
import { createChildLogger } from '@common/utils/logger';
import config from '@/config';

// Narrowed request metadata type for logging without using `any`
type RequestWithLoggingMeta = {
  logger?: ReturnType<typeof createChildLogger>;
  requestId?: string;
  method?: string;
  originalUrl?: string;
  ip?: string;
};

export const errorMiddleware = (
  error: Error,
  req: Request | null,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'An unexpected error occurred';

  // Determine status code and message based on error type
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    // Format Zod errors for a more user-friendly message
    const flattenedErrors = error.flatten();
    const fieldErrors = Object.entries(flattenedErrors.fieldErrors)
      .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
      .join(', ');
    message = fieldErrors || 'Validation failed';
  }

  // Get child logger from request or create new one
  const reqMeta = (
    req ? (req as unknown as RequestWithLoggingMeta) : ({} as unknown)
  ) as RequestWithLoggingMeta;
  const childLogger = reqMeta.logger || createChildLogger(reqMeta.requestId || 'unknown');

  // Log the error for debugging
  childLogger.error(
    {
      err: error,
      statusCode,
      method: reqMeta.method || 'unknown',
      url: reqMeta.originalUrl || 'unknown',
      ip: reqMeta.ip || 'unknown',
      stack: config.nodeEnv === 'development' ? error.stack : undefined,
      type: 'error-middleware',
    },
    `${statusCode} - ${message}`
  );

  // In production, don't send detailed error messages to the client
  if (config.nodeEnv === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Return consistent error response format
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};
