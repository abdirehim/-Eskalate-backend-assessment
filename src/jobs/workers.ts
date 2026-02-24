import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../config/redis';
import { AnalyticsService } from '../services';
import { logger } from '../utils/logger';

let analyticsWorker: Worker | null = null;

/**
 * Initialize all job queue workers
 */
export const initializeWorkers = async (): Promise<void> => {
    analyticsWorker = new Worker(
        'analytics',
        async (job: Job) => {
            switch (job.name) {
                case 'process-read':
                    // Individual read events are already recorded in the DB
                    // This job could be used for additional processing if needed
                    logger.debug(`Read event processed for article: ${job.data.articleId}`);
                    break;

                case 'aggregate-daily':
                    // Aggregate all read logs into daily analytics
                    await AnalyticsService.aggregateDailyAnalytics(
                        job.data.date ? new Date(job.data.date) : undefined
                    );
                    break;

                default:
                    logger.warn(`Unknown job type: ${job.name}`);
            }
        },
        {
            connection: getRedisConnection(),
            concurrency: 5,
        }
    );

    analyticsWorker.on('completed', (job) => {
        logger.debug(`Job ${job.id} completed (${job.name})`);
    });

    analyticsWorker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed (${job?.name}):`, err.message);
    });

    // Schedule daily aggregation (runs at midnight GMT)
    const { analyticsQueue } = await import('./queues');
    await analyticsQueue.add(
        'aggregate-daily',
        {},
        {
            repeat: {
                pattern: '0 0 * * *', // Every day at midnight
                tz: 'GMT',
            },
        }
    );

    logger.info('📊 Analytics worker started with daily aggregation scheduled');
};

/**
 * Gracefully close workers
 */
export const closeWorkers = async (): Promise<void> => {
    if (analyticsWorker) {
        await analyticsWorker.close();
    }
};
