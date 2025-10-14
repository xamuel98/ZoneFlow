import { Context } from 'hono';

// TypeScript interfaces for response types
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  errors: ValidationError[];
}

// Response options for customization
export interface ResponseOptions {
  statusCode?: number;
  headers?: Record<string, string>;
}

/**
 * Response handler class for standardized API responses
 * Provides consistent success and error response formats across all endpoints
 */
export class ResponseHandler {
  /**
   * Send a success response
   * @param c - Hono context
   * @param data - Response data
   * @param message - Optional success message
   * @param statusCode - HTTP status code (default: 200)
   * @param options - Additional response options
   */
  static success<T>(
    c: Context,
    data: T,
    message?: string,
    statusCode: number = 200,
    options?: ResponseOptions
  ) {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      ...(message && { message })
    };

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        c.header(key, value);
      });
    }

    return c.json(response, statusCode as any);
  }

  /**
   * Send an error response
   * @param c - Hono context
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 400)
   * @param code - Optional error code
   * @param options - Additional response options
   */
  static error(
    c: Context,
    message: string,
    statusCode: number = 400,
    code?: string,
    options?: ResponseOptions
  ) {
    const response: ErrorResponse = {
      success: false,
      error: message,
      ...(code && { code })
    };

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        c.header(key, value);
      });
    }

    return c.json(response, statusCode as any);
  }

  /**
   * Send a validation error response
   * @param c - Hono context
   * @param errors - Array of validation errors
   * @param message - Optional custom message (default: "Validation failed")
   * @param statusCode - HTTP status code (default: 422)
   */
  static validationError(
    c: Context,
    errors: ValidationError[],
    message: string = 'Validation failed',
    statusCode: number = 422
  ) {
    const response: ValidationErrorResponse = {
      success: false,
      error: message,
      errors
    };

    return c.json(response, statusCode as any);
  }

  /**
   * Send a not found error response
   * @param c - Hono context
   * @param resource - Optional resource name
   * @param message - Optional custom message
   */
  static notFound(
    c: Context,
    resource?: string,
    message?: string
  ) {
    const errorMessage = message || (resource ? `${resource} not found` : 'Resource not found');
    
    return this.error(c, errorMessage, 404, 'NOT_FOUND');
  }

  /**
   * Send an unauthorized error response
   * @param c - Hono context
   * @param message - Optional custom message
   */
  static unauthorized(
    c: Context,
    message: string = 'Unauthorized access'
  ) {
    return this.error(c, message, 401, 'UNAUTHORIZED');
  }

  /**
   * Send a forbidden error response
   * @param c - Hono context
   * @param message - Optional custom message
   */
  static forbidden(
    c: Context,
    message: string = 'Access forbidden'
  ) {
    return this.error(c, message, 403, 'FORBIDDEN');
  }

  /**
   * Send a server error response
   * @param c - Hono context
   * @param message - Optional custom message
   * @param error - Optional error object for logging
   */
  static serverError(
    c: Context,
    message: string = 'Internal server error',
    error?: Error
  ) {
    if (error) {
      console.error('Server error:', error);
    }
    
    return this.error(c, message, 500, 'INTERNAL_ERROR');
  }

  /**
   * Send a created response (for POST requests)
   * @param c - Hono context
   * @param data - Response data
   * @param message - Optional success message
   */
  static created<T>(
    c: Context,
    data: T,
    message?: string
  ) {
    return this.success(c, data, message, 201);
  }

  /**
   * Send a no content response (for DELETE requests)
   * @param c - Hono context
   * @param message - Optional success message
   */
  static noContent(
    c: Context,
    message?: string
  ) {
    if (message) {
      return this.success(c, null, message, 204);
    }
    return c.body(null, 204 as any);
  }

  /**
   * Send a conflict error response
   * @param c - Hono context
   * @param message - Error message
   */
  static conflict(
    c: Context,
    message: string
  ) {
    return this.error(c, message, 409, 'CONFLICT');
  }

  /**
   * Send a bad request error response
   * @param c - Hono context
   * @param message - Error message
   */
  static badRequest(
    c: Context,
    message: string
  ) {
    return this.error(c, message, 400, 'BAD_REQUEST');
  }
}

// Export convenience aliases
export const Response = ResponseHandler;
export default ResponseHandler;