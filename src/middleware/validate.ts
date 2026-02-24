import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

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
                next(new ValidationError(errors));
                return;
            }
            next(error);
        }
    };
};
