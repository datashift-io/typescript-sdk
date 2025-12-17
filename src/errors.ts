/**
 * Base error class for all Datashift SDK errors
 */
export class DatashiftError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'DatashiftError';
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Thrown when authentication fails (invalid API key, expired token, etc.)
 */
export class AuthenticationError extends DatashiftError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends DatashiftError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when request validation fails
 */
export class ValidationError extends DatashiftError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message, 400, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

/**
 * Thrown when an operation times out
 */
export class TimeoutError extends DatashiftError {
  constructor(message = 'Operation timed out') {
    super(message, 408, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown when rate limited
 */
export class RateLimitError extends DatashiftError {
  constructor(
    public retryAfter?: number,
  ) {
    super('Rate limit exceeded', 429, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

/**
 * Thrown when the server returns an error
 */
export class ServerError extends DatashiftError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}
