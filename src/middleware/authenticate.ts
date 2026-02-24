import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { UnauthorizedError } from '../utils/errors';

/**
 * Authentication middleware - verifies JWT token
 * Sets req.user with { sub, role } from the token
 */
export const authenticate = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid authorization header');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedError('Token not provided');
        }

        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            next(error);
            return;
        }
        next(new UnauthorizedError('Invalid or expired token'));
    }
};

/**
 * Optional authentication middleware
 * If a valid JWT is present, sets req.user; otherwise proceeds without it.
 * Used for endpoints that behave differently for logged-in vs guest users.
 */
export const optionalAuth = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
                req.user = decoded;
            }
        }
    } catch {
        // Token invalid — proceed as guest
    }

    next();
};
