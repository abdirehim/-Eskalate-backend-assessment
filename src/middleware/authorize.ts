import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Restricts access to users with the specified role(s).
 */
export const authorize = (...allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(new ForbiddenError('You do not have permission to access this resource'));
            return;
        }

        next();
    };
};
