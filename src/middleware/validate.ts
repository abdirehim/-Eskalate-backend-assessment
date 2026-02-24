import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Centralized validation middleware using Zod schemas.
 * Validates request body, query, and params against the provided schema.
 */
export const validate = (schema: AnyZodObject) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((e) => {
                    const path = e.path.slice(1).join('.'); // Remove 'body'/'query'/'params' prefix
                    return `${path}: ${e.message}`;
                });
                next({
                    statusCode: 422,
                    message: 'Validation failed',
                    errors,
                    isOperational: true,
                    name: 'ValidationError',
                } as Error & { statusCode: number; errors: string[]; isOperational: boolean });
                return;
            }
            next(error);
        }
    };
};
