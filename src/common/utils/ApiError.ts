/**
 * Enhanced ApiError class for better error handling
 * Distinguishes between operational and programming errors
 */
export class ApiError extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;
  [key: string]: any; // Allow additional properties

  constructor(
    statusCode: number,
    message: string,
    isOperationalOrContext?: boolean | any,
    context?: any
  ) {
    super(message);

    // Set the name property
    this.name = 'ApiError';

    // Assign properties
    this.statusCode = statusCode;

    // Handle overloaded parameters for backward compatibility
    if (typeof isOperationalOrContext === 'boolean') {
      this.isOperational = isOperationalOrContext;
      this.context = context;
    } else {
      // If third parameter is not boolean, treat it as context
      this.isOperational = true;
      this.context = isOperationalOrContext;
      // If context is an object, spread its properties onto this instance
      if (isOperationalOrContext && typeof isOperationalOrContext === 'object') {
        Object.assign(this, isOperationalOrContext);
      }
    }

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON representation
   */
  toJSON(): Record<string, any> {
    const json: Record<string, any> = {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
    };

    if (this.context) {
      json.context = this.context;
    }

    // Include stack trace only in development
    if (process.env.NODE_ENV !== 'production') {
      json.stack = this.stack;
    }

    return json;
  }

  /**
   * Static factory methods for common HTTP errors
   */

  // Client errors (4xx)
  static badRequest(message: string, context?: any): ApiError {
    return new ApiError(400, message, true, context);
  }

  static unauthorized(message: string, context?: any): ApiError {
    return new ApiError(401, message, true, context);
  }

  static forbidden(message: string, context?: any): ApiError {
    return new ApiError(403, message, true, context);
  }

  static notFound(message: string, context?: any): ApiError {
    return new ApiError(404, message, true, context);
  }

  static conflict(message: string, context?: any): ApiError {
    return new ApiError(409, message, true, context);
  }

  static unprocessableEntity(message: string, context?: any): ApiError {
    return new ApiError(422, message, true, context);
  }

  // Server errors (5xx)
  static internal(message: string, context?: any): ApiError {
    return new ApiError(500, message, false, context); // Not operational
  }

  static serviceUnavailable(message: string, context?: any): ApiError {
    return new ApiError(503, message, false, context); // Not operational
  }

  /**
   * Type guard to check if an error is an ApiError
   */
  static isApiError(error: any): error is ApiError {
    return error instanceof ApiError;
  }

  /**
   * Check if an error is operational (expected) vs programming error
   */
  static isOperationalError(error: any): boolean {
    if (error instanceof ApiError) {
      return error.isOperational;
    }
    return false;
  }
}
