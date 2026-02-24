import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

/**
 * Global error handler middleware.
 * Catches all errors and returns standardized response.
 * Never leaks stack traces to the client.
 */
export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log the full error in development
    if (config.nodeEnv === 'development') {
        logger.error('Error:', err);
    } else {
        logger.error('Error:', err.message);
    }

    // Handle known operational errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            Success: false,
            Message: err.message,
            Object: null,
            Errors: err.errors,
        });
        return;
    }

    // Handle JSON parsing errors
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            Success: false,
            Message: 'Invalid JSON in request body',
            Object: null,
            Errors: ['Malformed JSON'],
        });
        return;
    }

    // Handle unknown/unexpected errors — never leak details
    res.status(500).json({
        Success: false,
        Message: 'Internal server error',
        Object: null,
        Errors: ['An unexpected error occurred'],
    });
};
