import { Request, Response, NextFunction } from 'express';
import { ArticleService, AnalyticsService } from '../services';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendPaginated, sendError } from '../utils/response';

export class ArticleController {
    /**
     * POST /articles — Create article (Author only)
     */
    static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const article = await ArticleService.create(req.user!.sub, req.body);
            sendSuccess(res, 'Article created successfully', article, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /articles/me — Get author's own articles (Author only)
     */
    static async getMyArticles(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 10;
            const includeDeleted = req.query.includeDeleted === 'true';

            const { articles, total } = await ArticleService.getMyArticles(
                req.user!.sub,
                page,
                size,
                includeDeleted
            );

            sendPaginated(res, 'Articles retrieved successfully', articles, page, size, total);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /articles/:id — Update article (Author only, must own it)
     */
    static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const article = await ArticleService.update(req.params.id as string, req.user!.sub, req.body);
            sendSuccess(res, 'Article updated successfully', article);
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /articles/:id — Soft delete article (Author only, must own it)
     */
    static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await ArticleService.softDelete(req.params.id as string, req.user!.sub);
            sendSuccess(res, result.message);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /articles — Public news feed with filtering & pagination
     */
    static async getPublicFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { articles, total, page, size } = await ArticleService.getPublicFeed(req.query as any);
            sendPaginated(res, 'Articles retrieved successfully', articles, page, size, total);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /articles/:id — Read single article + record read event
     */
    static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const article = await ArticleService.getById(req.params.id as string);

            if (!article) {
                sendError(res, 'Article not found', ['Article not found'], 404);
                return;
            }

            if (article.deletedAt) {
                sendError(res, 'News article no longer available', ['News article no longer available'], 410);
                return;
            }

            // Record read event — non-blocking
            const readerId = req.user?.sub || null;
            AnalyticsService.recordRead(article.id, readerId, req.ip).catch(() => {
                // Already handled inside the service
            });

            sendSuccess(res, 'Article retrieved successfully', article);
        } catch (error) {
            next(error);
        }
    }
}
