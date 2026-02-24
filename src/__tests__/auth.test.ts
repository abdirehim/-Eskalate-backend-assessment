/**
 * HTTP Integration Tests — Auth Routes
 * User Story 1: Secure Signup & Authentication
 * User Story 2: Identity Management (Login)
 *
 * Uses supertest to fire real HTTP requests against the Express app.
 * Database and Redis are fully mocked via src/__tests__/setup.ts
 */

import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';

// ── Typed mock helpers ────────────────────────────────────────────────────────
const mockUser = prisma.user as jest.Mocked<typeof prisma.user>;

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// ── Shared test data ──────────────────────────────────────────────────────────
const validSignupBody = {
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'StrongPass!1',
    role: 'author',
};

const savedUser = {
    id: 'user-uuid-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'hashed_password',
    role: 'author',
};

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/signup — User Story 1', () => {
    afterEach(() => jest.clearAllMocks());

    it('should register a new user and return 201 with user object (no password)', async () => {
        mockUser.findUnique.mockResolvedValueOnce(null); // no existing user
        (mockedBcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password');
        mockUser.create.mockResolvedValueOnce({
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
        } as any);

        const res = await request(app).post('/api/v1/auth/signup').send(validSignupBody);

        expect(res.status).toBe(201);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toMatchObject({
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
        });
        // Password must NEVER be exposed in the response
        expect(res.body.Object).not.toHaveProperty('password');
    });

    it('should return 409 when email already exists', async () => {
        mockUser.findUnique.mockResolvedValueOnce(savedUser as any);

        const res = await request(app).post('/api/v1/auth/signup').send(validSignupBody);

        expect(res.status).toBe(409);
        expect(res.body.Success).toBe(false);
        expect(res.body.Errors).toEqual(
            expect.arrayContaining([expect.stringContaining('already exists')])
        );
    });

    it('should return 422 when name contains digits', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ ...validSignupBody, name: 'Alice123' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
        expect(res.body.Errors).toBeDefined();
    });

    it('should return 422 when password is weak (missing uppercase)', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ ...validSignupBody, password: 'weakpass1!' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
    });

    it('should return 422 when role is invalid', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ ...validSignupBody, role: 'Admin' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
    });

    it('should return 422 when email is malformed', async () => {
        const res = await request(app)
            .post('/api/v1/auth/signup')
            .send({ ...validSignupBody, email: 'not-an-email' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login — User Story 2', () => {
    afterEach(() => jest.clearAllMocks());

    const loginBody = { email: 'alice@example.com', password: 'StrongPass!1' };

    it('should return 200 with JWT token and user object on valid credentials', async () => {
        mockUser.findUnique.mockResolvedValueOnce(savedUser as any);
        (mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
        (mockedJwt.sign as jest.Mock).mockReturnValueOnce('fake_jwt_token');

        const res = await request(app).post('/api/v1/auth/login').send(loginBody);

        expect(res.status).toBe(200);
        expect(res.body.Success).toBe(true);
        expect(res.body.Object).toHaveProperty('token', 'fake_jwt_token');
        expect(res.body.Object.user).toMatchObject({
            id: savedUser.id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
        });
        expect(res.body.Object.user).not.toHaveProperty('password');
    });

    it('should return 401 when email does not exist', async () => {
        mockUser.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).post('/api/v1/auth/login').send(loginBody);

        expect(res.status).toBe(401);
        expect(res.body.Success).toBe(false);
        expect(res.body.Errors).toEqual(
            expect.arrayContaining([expect.stringContaining('Invalid email or password')])
        );
    });

    it('should return 401 when password is incorrect', async () => {
        mockUser.findUnique.mockResolvedValueOnce(savedUser as any);
        (mockedBcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

        const res = await request(app).post('/api/v1/auth/login').send(loginBody);

        expect(res.status).toBe(401);
        expect(res.body.Success).toBe(false);
    });

    it('should return 422 when email field is missing', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ password: 'StrongPass!1' });

        expect(res.status).toBe(422);
        expect(res.body.Success).toBe(false);
    });
});
