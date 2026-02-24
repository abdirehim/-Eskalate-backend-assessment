import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services';
import { AuthenticatedRequest } from '../types';
import { sendPaginated } from '../utils/response';

export class DashboardController {
    /**
     * GET /author/dashboard — Author performance metrics
     */
    static async getDashboard(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 10;

            const { articles, total } = await AnalyticsService.getAuthorDashboard(
                req.user!.sub,
                page,
                size
            );

            sendPaginated(res, 'Dashboard data retrieved successfully', articles, page, size, total);
        } catch (error) {
            next(error);
        }
    }
}
