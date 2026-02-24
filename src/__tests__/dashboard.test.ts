/**
 * HTTP Integration Tests — Dashboard Route
 * User Story 7: Author Performance Dashboard
 *
 * Uses supertest to fire real HTTP requests against the Express app.
 * Database and Redis are fully mocked via src/__tests__/setup.ts
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';

// ── Typed mock helpers ────────────────────────────────────────────────────────
const mockArticle = prisma.article as jest.Mocked<typeof prisma.article>;

jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// ── Shared helpers ────────────────────────────────────────────────────────────
const authorPayload = { sub: 'author-uuid-1', role: 'author' };
const readerPayload = { sub: 'reader-uuid-1', role: 'reader' };

function mockJwtVerify(payload: object) {
    (mockedJwt.verify as jest.Mock).mockImplementation(() => payload);
}

/** Dashboard item shape returned by AnalyticsService.getAuthorDashboard */
const dashboardItem = {
    id: 'article-uuid-1',
    title: 'Breaking News Today',
    category: 'Tech',
    status: 'Published',
    createdAt: new Date('2025-01-01'),
    TotalViews: 42,
};

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/v1/author/dashboard — Story 7: Author Performance Dashboard', () => {
    afterEach(() => jest.clearAllMocks());

    it('should return paginated dashboard items with TotalViews for an Author', async () => {
        mockJwtVerify(authorPayload);

        // getAuthorDashboard calls article.findMany + article.count
        mockArticle.findMany.mockResolvedValueOnce([
            {
                ...dashboardItem,
                dailyAnalytics: [{ viewCount: 20 }, { viewCount: 22 }],
            },
        ] as any);
        mockArticle.count.mockResolvedValueOnce(1);

        const res = await request(app)
            .get('/api/v1/author/dashboard')
            .set('Authorization', 'Bearer mock_author_token');

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toHaveLength(1);
        // Verify TotalViews is a number (summed analytics)
        expect(typeof res.body.Object[0].TotalViews).toBe('number');
        expect(res.body.PageNumber).toBe(1);
        expect(res.body.PageSize).toBe(10);
        expect(res.body.TotalSize).toBe(1);
    });

    it('should return paginated items when author has 0 articles', async () => {
        mockJwtVerify(authorPayload);
        mockArticle.findMany.mockResolvedValueOnce([] as any);
        mockArticle.count.mockResolvedValueOnce(0);

        const res = await request(app)
            .get('/api/v1/author/dashboard')
            .set('Authorization', 'Bearer mock_author_token');

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toEqual([]);
        expect(res.body.TotalSize).toBe(0);
    });

    it('should support custom pagination (page=2&size=5)', async () => {
        mockJwtVerify(authorPayload);
        mockArticle.findMany.mockResolvedValueOnce([{ ...dashboardItem, dailyAnalytics: [] }] as any);
        mockArticle.count.mockResolvedValueOnce(11);

        const res = await request(app)
            .get('/api/v1/author/dashboard?page=2&size=5')
            .set('Authorization', 'Bearer mock_author_token');

        expect(res.status).toBe(200);
        expect(res.body.PageNumber).toBe(2);
        expect(res.body.PageSize).toBe(5);
    });

    it('should return 401 if no token is provided', async () => {
        const res = await request(app).get('/api/v1/author/dashboard');

        expect(res.status).toBe(401);
        expect(res.body.Success).toBe(false);
    });

    it('should return 403 if a Reader tries to access the dashboard', async () => {
        mockJwtVerify(readerPayload);

        const res = await request(app)
            .get('/api/v1/author/dashboard')
            .set('Authorization', 'Bearer mock_reader_token');

        expect(res.status).toBe(403);
        expect(res.body.Success).toBe(false);
    });
});
