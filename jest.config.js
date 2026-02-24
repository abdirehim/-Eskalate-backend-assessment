/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
        '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@validators/(.*)$': '<rootDir>/src/validators/$1',
        '^@jobs/(.*)$': '<rootDir>/src/jobs/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/server.ts',
        '!src/types/**',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    setupFilesAfterSetup: ['<rootDir>/src/__tests__/setup.ts'],
};
