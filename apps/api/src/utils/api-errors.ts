/**
 * Standardized API Error Handling
 * 
 * This module provides a consistent error response structure across all API endpoints.
 * All errors should use the ApiError class to ensure uniform error responses.
 */

// Error codes enum for type safety and autocomplete
export const ErrorCodes = {
    // Authentication errors (401)
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    UNAUTHORIZED: 'UNAUTHORIZED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',

    // Authorization errors (403)
    FORBIDDEN: 'FORBIDDEN',

    // Resource errors (404)
    NOT_FOUND: 'NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    RESTAURANT_NOT_FOUND: 'RESTAURANT_NOT_FOUND',

    // Conflict errors (409)
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    SLUG_ALREADY_EXISTS: 'SLUG_ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Validation errors (400)
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',

    // Server errors (500)
    SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Default messages for error codes
const defaultMessages: Record<ErrorCode, string> = {
    [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCodes.UNAUTHORIZED]: 'You must be logged in to access this resource',
    [ErrorCodes.TOKEN_EXPIRED]: 'Session expired. Please login again',
    [ErrorCodes.INVALID_TOKEN]: 'Invalid or expired token',
    [ErrorCodes.FORBIDDEN]: "You don't have permission to perform this action",
    [ErrorCodes.NOT_FOUND]: 'Resource not found',
    [ErrorCodes.USER_NOT_FOUND]: 'User not found',
    [ErrorCodes.RESTAURANT_NOT_FOUND]: 'Restaurant not found',
    [ErrorCodes.EMAIL_ALREADY_EXISTS]: 'Email already registered',
    [ErrorCodes.SLUG_ALREADY_EXISTS]: 'Restaurant slug already taken',
    [ErrorCodes.CONFLICT]: 'Resource already exists',
    [ErrorCodes.VALIDATION_ERROR]: 'Invalid request data',
    [ErrorCodes.BAD_REQUEST]: 'Invalid request',
    [ErrorCodes.SERVER_ERROR]: 'Something went wrong. Please try again later',
};

// HTTP status codes for error codes
const statusCodes: Record<ErrorCode, number> = {
    [ErrorCodes.INVALID_CREDENTIALS]: 401,
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.TOKEN_EXPIRED]: 401,
    [ErrorCodes.INVALID_TOKEN]: 401,
    [ErrorCodes.FORBIDDEN]: 403,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.USER_NOT_FOUND]: 404,
    [ErrorCodes.RESTAURANT_NOT_FOUND]: 404,
    [ErrorCodes.EMAIL_ALREADY_EXISTS]: 409,
    [ErrorCodes.SLUG_ALREADY_EXISTS]: 409,
    [ErrorCodes.CONFLICT]: 409,
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.BAD_REQUEST]: 400,
    [ErrorCodes.SERVER_ERROR]: 500,
};

/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(code: ErrorCode, message?: string) {
        super(message || defaultMessages[code]);
        this.code = code;
        this.statusCode = statusCodes[code];
        this.isOperational = true; // Distinguishes from programming errors

        // Maintains proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Converts the error to a JSON response structure
     */
    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
            },
        };
    }
}

// Factory functions for common errors
export const ApiErrors = {
    invalidCredentials: () => new ApiError(ErrorCodes.INVALID_CREDENTIALS),

    unauthorized: (message?: string) => new ApiError(ErrorCodes.UNAUTHORIZED, message),

    tokenExpired: () => new ApiError(ErrorCodes.TOKEN_EXPIRED),

    invalidToken: () => new ApiError(ErrorCodes.INVALID_TOKEN),

    forbidden: (message?: string) => new ApiError(ErrorCodes.FORBIDDEN, message),

    notFound: (resource?: string) => new ApiError(
        ErrorCodes.NOT_FOUND,
        resource ? `${resource} not found` : undefined
    ),

    userNotFound: () => new ApiError(ErrorCodes.USER_NOT_FOUND),

    restaurantNotFound: () => new ApiError(ErrorCodes.RESTAURANT_NOT_FOUND),

    emailExists: () => new ApiError(ErrorCodes.EMAIL_ALREADY_EXISTS),

    slugExists: () => new ApiError(ErrorCodes.SLUG_ALREADY_EXISTS),

    conflict: (message: string) => new ApiError(ErrorCodes.CONFLICT, message),

    validation: (message: string) => new ApiError(ErrorCodes.VALIDATION_ERROR, message),

    badRequest: (message: string) => new ApiError(ErrorCodes.BAD_REQUEST, message),

    serverError: (message?: string) => new ApiError(ErrorCodes.SERVER_ERROR, message),
};
