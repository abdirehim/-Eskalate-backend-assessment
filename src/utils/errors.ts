/**
 * Custom application error with HTTP status code
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errors: string[];
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 400,
        errors: string[] = [],
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors.length > 0 ? errors : [message];
        this.isOperational = isOperational;

        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409);
    }
}

export class ValidationError extends AppError {
    constructor(errors: string[]) {
        super('Validation failed', 422, errors);
    }
}
