import app from './app';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { initializeWorkers } from './jobs/workers';

const startServer = async (): Promise<void> => {
    try {
        // Test database connection
        await prisma.$connect();
        logger.info('✅ Database connected successfully');

        // Initialize job queue workers
        await initializeWorkers();
        logger.info('✅ Job queue workers initialized');

        // Start Express server
        app.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();
