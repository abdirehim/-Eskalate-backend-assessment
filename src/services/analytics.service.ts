import { prisma } from '../config/database';
import { analyticsQueue } from '../jobs/queues';
import { logger } from '../utils/logger';

export class AnalyticsService {
    /**
     * Record a read event (non-blocking).
     * Creates a ReadLog entry and adds to analytics queue.
     */
    static async recordRead(articleId: string, readerId: string | null): Promise<void> {
        try {
            // Create ReadLog entry
            await prisma.readLog.create({
                data: {
                    articleId,
                    readerId,
                },
            });

            // Enqueue for daily analytics processing (non-blocking)
            await analyticsQueue.add('process-read', {
                articleId,
                readAt: new Date().toISOString(),
            });
        } catch (error) {
            // Log but don't throw — read tracking should never block article response
            logger.error('Failed to record read:', error);
        }
    }

    /**
     * Aggregate read logs into daily analytics.
     * Called by the job queue worker.
     * Uses GMT timezone for date aggregation.
     */
    static async aggregateDailyAnalytics(date?: Date): Promise<void> {
        const targetDate = date || new Date();

        // Get start and end of day in GMT
        const startOfDay = new Date(
            Date.UTC(
                targetDate.getUTCFullYear(),
                targetDate.getUTCMonth(),
                targetDate.getUTCDate(),
                0, 0, 0, 0
            )
        );
        const endOfDay = new Date(
            Date.UTC(
                targetDate.getUTCFullYear(),
                targetDate.getUTCMonth(),
                targetDate.getUTCDate(),
                23, 59, 59, 999
            )
        );

        // Get all read logs for the day grouped by article
        const readCounts = await prisma.readLog.groupBy({
            by: ['articleId'],
            where: {
                readAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            _count: {
                id: true,
            },
        });

        // Upsert daily analytics for each article
        const dateOnly = startOfDay.toISOString().split('T')[0]; // YYYY-MM-DD

        for (const record of readCounts) {
            await prisma.dailyAnalytics.upsert({
                where: {
                    articleId_date: {
                        articleId: record.articleId,
                        date: new Date(dateOnly),
                    },
                },
                update: {
                    viewCount: record._count.id,
                },
                create: {
                    articleId: record.articleId,
                    viewCount: record._count.id,
                    date: new Date(dateOnly),
                },
            });
        }

        logger.info(
            `📊 Daily analytics aggregated: ${readCounts.length} articles processed for ${dateOnly}`
        );
    }

    /**
     * Get author dashboard data — articles with total view counts
     */
    static async getAuthorDashboard(authorId: string, page: number = 1, size: number = 10) {
        const where = {
            authorId,
            deletedAt: null,
        };

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip: (page - 1) * size,
                take: size,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    category: true,
                    status: true,
                    createdAt: true,
                    dailyAnalytics: {
                        select: {
                            viewCount: true,
                        },
                    },
                },
            }),
            prisma.article.count({ where }),
        ]);

        // Transform: sum up daily view counts into TotalViews
        const dashboardItems = articles.map((article) => ({
            id: article.id,
            title: article.title,
            category: article.category,
            status: article.status,
            createdAt: article.createdAt,
            TotalViews: article.dailyAnalytics.reduce(
                (sum, da) => sum + da.viewCount,
                0
            ),
        }));

        return { articles: dashboardItems, total };
    }
}
