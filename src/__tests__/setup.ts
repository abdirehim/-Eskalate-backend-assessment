// Global test setup — runs before all tests
// Mock Prisma client for unit tests
jest.mock('../config/database', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        article: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
        readLog: {
            create: jest.fn(),
            groupBy: jest.fn(),
        },
        dailyAnalytics: {
            upsert: jest.fn(),
            findMany: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    },
}));

// Mock Redis/BullMQ for unit tests
jest.mock('../config/redis', () => ({
    getRedisConnection: jest.fn(() => ({})),
}));

jest.mock('../jobs/queues', () => ({
    analyticsQueue: {
        add: jest.fn(),
    },
}));

// Silence console during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});
