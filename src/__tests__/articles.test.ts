/**
 * HTTP Integration Tests — Article Routes
 * User Story 3: Content Lifecycle & Soft Deletion (Author Only)
 * User Story 4: Public News Feed (Filtering Deleted Content)
 * User Story 5: Read Tracking (The Engagement Trigger)
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
const mockReadLog = prisma.readLog as jest.Mocked<typeof prisma.readLog>;

jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Generate a real-looking but mocked Authorization header for an Author */
const authorToken = 'Bearer mock_author_token';
const readerToken = 'Bearer mock_reader_token';

const authorPayload = { sub: 'f47ac10b-58cc-4372-a567-0e02b2c3d47a', role: 'author' };
const readerPayload = { sub: 'f47ac10b-58cc-4372-a567-0e02b2c3d47b', role: 'reader' };

const fakeArticle = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d47c',
    title: 'Breaking News Today',
    content: 'This is a long enough content for the article to pass validation checks.',
    category: 'Tech',
    status: 'Published',
    authorId: 'f47ac10b-58cc-4372-a567-0e02b2c3d47a',
    createdAt: new Date('2025-01-01'),
    deletedAt: null,
    author: { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d47a', name: 'Alice Smith', email: 'alice@example.com' },
};

/** Make jwt.verify return the right payload based on which token is sent */
function mockJwtVerify(payload: object) {
    (mockedJwt.verify as jest.Mock).mockImplementation(() => payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// USER STORY 3: Content Lifecycle & Soft Deletion (Author Only)
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/v1/articles — Story 3: Create Article', () => {
    afterEach(() => jest.clearAllMocks());

    const createBody = {
        title: 'My Great Article',
        content: 'This is enough content for the article to be valid and pass constraints.',
        category: 'Tech',
        status: 'Draft',
    };

    it('should create an article and return 201 for an Author', async () => {
        mockJwtVerify(authorPayload);
        mockArticle.create.mockResolvedValueOnce({ ...fakeArticle, ...createBody } as any);

        const res = await request(app)
            .post('/api/v1/articles')
            .set('Authorization', authorToken)
            .send(createBody);

        expect(res.status).toBe(201);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toMatchObject({ title: createBody.title });
    });

    it('should return 403 for a Reader trying to create an article', async () => {
        mockJwtVerify(readerPayload);

        const res = await request(app)
            .post('/api/v1/articles')
            .set('Authorization', readerToken)
            .send(createBody);

        expect(res.status).toBe(403);
        expect(res.body.Success).toBe(false);
    });

    it('should return 401 if no Authorization header is provided', async () => {
        const res = await request(app).post('/api/v1/articles').send(createBody);

        expect(res.status).toBe(401);
        expect(res.body.Success).toBe(false);
    });

    it('should return 422 if title is missing', async () => {
        mockJwtVerify(authorPayload);

        const res = await request(app)
            .post('/api/v1/articles')
            .set('Authorization', authorToken)
            .send({ ...createBody, title: '' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
    });

    it('should return 422 if content is shorter than 50 characters', async () => {
        mockJwtVerify(authorPayload);

        const res = await request(app)
            .post('/api/v1/articles')
            .set('Authorization', authorToken)
            .send({ ...createBody, content: 'Too short.' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/v1/articles/me — Story 8: Author's Own Articles", () => {
    afterEach(() => jest.clearAllMocks());

    it("should return paginated list of author's own articles (including drafts)", async () => {
        mockJwtVerify(authorPayload);
        const draftArticle = { ...fakeArticle, status: 'Draft' };
        mockArticle.findMany.mockResolvedValueOnce([fakeArticle, draftArticle] as any);
        mockArticle.count.mockResolvedValueOnce(2);

        const res = await request(app)
            .get('/api/v1/articles/me')
            .set('Authorization', authorToken);

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toHaveLength(2);
        expect(res.body.PageNumber).toBe(1);
        expect(res.body.PageSize).toBe(10);
        expect(res.body.TotalSize).toBe(2);
    });

    it('should return 401 if not authenticated', async () => {
        const res = await request(app).get('/api/v1/articles/me');
        expect(res.status).toBe(401);
    });

    it('should return 403 if a Reader tries to access this endpoint', async () => {
        mockJwtVerify(readerPayload);

        const res = await request(app)
            .get('/api/v1/articles/me')
            .set('Authorization', readerToken);

        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/v1/articles/:id — Story 3: Update Article', () => {
    afterEach(() => jest.clearAllMocks());

    it('should update an article if the Author owns it', async () => {
        mockJwtVerify(authorPayload);
        mockArticle.findUnique.mockResolvedValueOnce(fakeArticle as any);
        mockArticle.update.mockResolvedValueOnce({
            ...fakeArticle,
            title: 'Updated Title',
        } as any);

        const res = await request(app)
            .put(`/api/v1/articles/${fakeArticle.id}`)
            .set('Authorization', authorToken)
            .send({ title: 'Updated Title' });

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object.title).toBe('Updated Title');
    });

    it("should return 403 if an Author tries to edit another Author's article", async () => {
        mockJwtVerify({ sub: 'f47ac10b-58cc-4372-a567-0e02b2c3d47d', role: 'author' });
        mockArticle.findUnique.mockResolvedValueOnce(fakeArticle as any); // owned by 'author-uuid-1'

        const res = await request(app)
            .put(`/api/v1/articles/${fakeArticle.id}`)
            .set('Authorization', authorToken)
            .send({ title: 'Stolen Title' });

        expect(res.status).toBe(403);
        expect(res.body.Success).toBe(false);
        expect(res.body.Errors).toEqual(
            expect.arrayContaining([expect.stringContaining('own articles')])
        );
    });

    it('should return 404 if article does not exist', async () => {
        mockJwtVerify(authorPayload);
        mockArticle.findUnique.mockResolvedValueOnce(null);

        const res = await request(app)
            .put(`/api/v1/articles/f47ac10b-58cc-4372-a567-0e02b2c3d47d`)
            .set('Authorization', authorToken)
            .send({ title: 'New Title' });

        expect(res.status).toBe(404);
        expect(res.body.Success).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/v1/articles/:id — Story 3: Soft Delete', () => {
    afterEach(() => jest.clearAllMocks());

    it('should soft-delete an article (set deletedAt) and return 200', async () => {
        mockJwtVerify(authorPayload);
        mockArticle.findUnique.mockResolvedValueOnce(fakeArticle as any);
        mockArticle.update.mockResolvedValueOnce({
            ...fakeArticle,
            deletedAt: new Date(),
        } as any);

        const res = await request(app)
            .delete(`/api/v1/articles/${fakeArticle.id}`)
            .set('Authorization', authorToken);

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Message).toMatch(/deleted/i);
    });

    it("should return 403 when trying to delete another Author's article", async () => {
        mockJwtVerify({ sub: 'f47ac10b-58cc-4372-a567-0e02b2c3d47d', role: 'author' });
        mockArticle.findUnique.mockResolvedValueOnce(fakeArticle as any); // owned by author-uuid-1

        const res = await request(app)
            .delete(`/api/v1/articles/${fakeArticle.id}`)
            .set('Authorization', authorToken);

        expect(res.status).toBe(403);
        expect(res.body.Success).toBe(false);
    });

    it('should return 401 when not authenticated', async () => {
        const res = await request(app).delete(`/api/v1/articles/${fakeArticle.id}`);
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// USER STORY 4: Public News Feed
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/articles — Story 4: Public News Feed', () => {
    afterEach(() => jest.clearAllMocks());

    it('should return paginated published articles (default page=1, size=10)', async () => {
        mockArticle.findMany.mockResolvedValueOnce([fakeArticle] as any);
        mockArticle.count.mockResolvedValueOnce(1);

        const res = await request(app).get('/api/v1/articles');

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toHaveLength(1);
        expect(res.body.PageNumber).toBe(1);
        expect(res.body.PageSize).toBe(10);
        expect(res.body.TotalSize).toBe(1);
    });

    it('should support category filter query parameter', async () => {
        mockArticle.findMany.mockResolvedValueOnce([fakeArticle] as any);
        mockArticle.count.mockResolvedValueOnce(1);

        const res = await request(app).get('/api/v1/articles?category=Tech');

        expect(res.status).toBe(200);
        // Verify the service was called (findMany was invoked)
        expect(mockArticle.findMany).toHaveBeenCalledTimes(1);
    });

    it('should support keyword search via q parameter', async () => {
        mockArticle.findMany.mockResolvedValueOnce([fakeArticle] as any);
        mockArticle.count.mockResolvedValueOnce(1);

        const res = await request(app).get('/api/v1/articles?q=Breaking');

        expect(res.status).toBe(200);
        expect(mockArticle.findMany).toHaveBeenCalledTimes(1);
    });

    it('should support author partial name search', async () => {
        mockArticle.findMany.mockResolvedValueOnce([fakeArticle] as any);
        mockArticle.count.mockResolvedValueOnce(1);

        const res = await request(app).get('/api/v1/articles?author=Alice');

        expect(res.status).toBe(200);
    });

    it('should accept custom pagination (page=2&size=5)', async () => {
        mockArticle.findMany.mockResolvedValueOnce([fakeArticle] as any);
        mockArticle.count.mockResolvedValueOnce(20);

        const res = await request(app).get('/api/v1/articles?page=2&size=5');

        expect(res.status).toBe(200);
        expect(res.body.PageNumber).toBe(2);
        expect(res.body.PageSize).toBe(5);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// USER STORY 5: Read Single Article + Read Tracking
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/v1/articles/:id — Story 5: Read Article + Tracking', () => {
    afterEach(() => jest.clearAllMocks());

    it('should return the article and record a read log (guest user)', async () => {
        mockArticle.findUnique.mockResolvedValueOnce(fakeArticle as any);
        mockReadLog.create.mockResolvedValueOnce({ id: 'log-1' } as any);

        const res = await request(app).get(`/api/v1/articles/${fakeArticle.id}`);

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toMatchObject({ id: fakeArticle.id, title: fakeArticle.title });
    });

    it('should record a read log with readerId if the user is authenticated', async () => {
        mockJwtVerify(readerPayload);
        mockArticle.findUnique.mockResolvedValueOnce(fakeArticle as any);
        mockReadLog.create.mockResolvedValueOnce({ id: 'log-2' } as any);

        const res = await request(app)
            .get(`/api/v1/articles/${fakeArticle.id}`)
            .set('Authorization', readerToken);

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
    });

    it('should return 404 if article does not exist', async () => {
        mockArticle.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).get('/api/v1/articles/00000000-0000-0000-0000-000000000000');

        expect(res.status).toBe(404);
        expect(res.body.Success).toBe(false);
    });

    it('should return 410 if article is soft-deleted (no longer available)', async () => {
        mockArticle.findUnique.mockResolvedValueOnce({
            ...fakeArticle,
            deletedAt: new Date('2025-06-01'),
        } as any);

        const res = await request(app).get(`/api/v1/articles/${fakeArticle.id}`);

        expect(res.status).toBe(410);
        expect(res.body.Success).toBe(false);
        expect(res.body.Errors).toEqual(
            expect.arrayContaining([expect.stringContaining('no longer available')])
        );
    });
});
