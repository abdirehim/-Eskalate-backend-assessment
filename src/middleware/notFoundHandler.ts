import { Request, Response } from 'express';

/**
 * Handles 404 Not Found for unmatched routes
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
    res.status(404).json({
        Success: false,
        Message: 'Route not found',
        Object: null,
        Errors: [`Route ${_req.method} ${_req.originalUrl} not found`],
    });
};
