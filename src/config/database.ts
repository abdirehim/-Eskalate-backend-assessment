import { PrismaClient } from '@prisma/client';
import { config } from './environment';

const prismaClientSingleton = (): PrismaClient => {
    return new PrismaClient({
        log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
};

declare global {
    // eslint-disable-next-line no-var
    var prismaGlobal: PrismaClient | undefined;
}

// Prevent multiple instances during hot-reloads in development
export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (config.nodeEnv !== 'production') {
    globalThis.prismaGlobal = prisma;
}
