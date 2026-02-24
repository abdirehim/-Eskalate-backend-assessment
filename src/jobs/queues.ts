import { Queue } from 'bullmq';
import { getRedisConnection } from '../config/redis';

/**
 * Analytics processing queue
 * Handles read event processing and daily aggregation
 */
export const analyticsQueue = new Queue('analytics', {
    connection: getRedisConnection(),
    defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
    },
});
