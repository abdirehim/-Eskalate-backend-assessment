import IORedis from 'ioredis';
import { config } from './environment';
import { logger } from '../utils/logger';

let redisConnection: IORedis | null = null;

export const getRedisConnection = (): IORedis => {
    if (!redisConnection) {
        redisConnection = new IORedis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            maxRetriesPerRequest: null, // Required for BullMQ
        });

        redisConnection.on('connect', () => {
            logger.info('✅ Redis connected');
        });

        redisConnection.on('error', (err) => {
            logger.error('❌ Redis connection error:', err);
        });
    }

    return redisConnection;
};
