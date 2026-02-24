# 📰 News API

A robust, production-ready RESTful API built with **Node.js + TypeScript** where **Authors** publish content and **Readers** consume it. Features a built-in **Analytics Engine** that records high-frequency user engagement and processes view counts into daily reports for performance tracking.

---

## 📋 Table of Contents

- [Technology Choices](#-technology-choices)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Testing](#-testing)

---

## ⚙️ Technology Choices

| Technology | Purpose | Why This Choice |
|---|---|---|
| **Node.js + TypeScript** | Runtime & Language | Required by the assessment. TypeScript adds compile-time type safety, reducing runtime bugs and improving developer experience with autocompletion and refactoring support. |
| **Express.js** | HTTP Framework | Industry-standard, minimal, and unopinionated — gives full control over middleware composition and route design without unnecessary abstraction. |
| **PostgreSQL** | Database | SQL-based as encouraged by the spec. Excellent support for UUID primary keys, date operations (critical for daily analytics aggregation), and complex queries with filtering. |
| **Prisma ORM** | Database Access | Type-safe database client auto-generated from the schema. Provides compile-time query validation, migration management, and eliminates raw SQL errors. The `@@unique` constraint on `[articleId, date]` maps directly to the DailyAnalytics requirement. |
| **BCrypt** | Password Hashing | Battle-tested, salted hashing algorithm. Uses 12 salt rounds for strong protection against brute-force attacks while maintaining acceptable hashing speed. |
| **JSON Web Tokens (JWT)** | Authentication | Stateless authentication with `sub` (userId) and `role` claims embedded in the token. 24-hour expiration provides reasonable session length without requiring server-side session storage. |
| **Zod** | Validation | Runtime schema validation with TypeScript type inference. Allows defining validation rules once and extracting TypeScript types automatically — single source of truth for both validation and types. |
| **BullMQ + Redis** | Job Queue | The analytics engine requires processing read events into daily reports. BullMQ provides reliable job queuing with retry logic, cron scheduling (midnight GMT aggregation), and concurrent processing without blocking the main API response cycle. |
| **Helmet + CORS** | Security | Helmet sets secure HTTP headers (XSS protection, content type sniffing prevention, etc.). CORS enables controlled cross-origin access. |
| **Jest + ts-jest** | Testing | Standard testing framework for Node.js with first-class TypeScript support via ts-jest. Supports mocking Prisma and Redis for isolated unit tests without external dependencies. |

---

## 📦 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** >= 18.0.0 — [Download](https://nodejs.org/)
- **PostgreSQL** >= 14 — [Download](https://www.postgresql.org/download/)
- **Redis** >= 6 — [Download](https://redis.io/download) (or use [Memurai](https://www.memurai.com/) on Windows)
- **npm** >= 9 (comes with Node.js)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd -Eskalate-backend-assessment
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Open `.env` and fill in your actual values (see [Environment Variables](#-environment-variables) section below for details).

### 4. Set Up the Database

Make sure PostgreSQL is running, then:

```bash
# Create the database (if it doesn't exist)
# You can do this via psql:
# psql -U postgres -c "CREATE DATABASE news_api;"

# Generate the Prisma client
npx prisma generate

# Run database migrations to create all tables
npx prisma migrate dev --name init
```

### 5. Start Redis

Make sure Redis is running on the configured host and port:

```bash
# Linux/Mac
redis-server

# Windows (if using Memurai)
# Memurai runs as a Windows service automatically
```

### 6. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`. You can verify it's running by hitting the health check:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "Success": true,
  "Message": "API is running",
  "Object": { "status": "healthy", "timestamp": "2026-02-24T12:00:00.000Z" },
  "Errors": null
}
```

---

## 🔐 Environment Variables

All environment variables are defined in the `.env` file. A template is provided in `.env.example`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Application environment. Use `development`, `test`, or `production`. |
| `PORT` | No | `3000` | Port the server listens on. |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public` |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens. Use a strong, random string in production (e.g., 64+ characters). |
| `JWT_EXPIRES_IN` | No | `24h` | JWT token expiration time. Supports formats like `24h`, `7d`, `3600s`. |
| `REDIS_HOST` | No | `localhost` | Redis server hostname. |
| `REDIS_PORT` | No | `6379` | Redis server port. |
| `REDIS_PASSWORD` | No | *(empty)* | Redis server password (if authentication is enabled). |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Global API rate limit window in milliseconds (default: 1 minute). |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Maximum requests per window per IP. |
| `READ_TRACKING_WINDOW_SECONDS` | No | `10` | Time window for read-tracking deduplication (prevents the same user from generating excessive ReadLog entries). |
| `READ_TRACKING_MAX_READS` | No | `1` | Maximum read events allowed per user per article within the tracking window. |

### Example `.env` File

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/news_api?schema=public"

JWT_SECRET="a-very-long-and-secure-random-string-change-this-in-production-1234567890"
JWT_EXPIRES_IN="24h"

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

READ_TRACKING_WINDOW_SECONDS=10
READ_TRACKING_MAX_READS=1
```

---

## 🏃 Running the Project

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot-reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` |
| `npm start` | Run the compiled production build |
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev` | Create and apply new database migrations |
| `npx prisma migrate deploy` | Apply pending migrations in production |
| `npx prisma studio` | Open Prisma Studio (visual database browser) |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup` | Public | Register a new user (author or reader) |
| `POST` | `/api/v1/auth/login` | Public | Login and receive a JWT token |

### Articles

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/articles` | Public | — | Browse published articles (paginated, with filters) |
| `GET` | `/api/v1/articles/:id` | Optional | — | Read a single article (tracks engagement) |
| `GET` | `/api/v1/articles/me` | Required | Author | List your own articles (including drafts) |
| `POST` | `/api/v1/articles` | Required | Author | Create a new article |
| `PUT` | `/api/v1/articles/:id` | Required | Author | Update your own article |
| `DELETE` | `/api/v1/articles/:id` | Required | Author | Soft-delete your own article |

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/author/dashboard` | Required | Author | View your article performance metrics |

### Query Parameters (GET /articles)

| Parameter | Type | Description |
|---|---|---|
| `category` | string | Filter by exact category (e.g., `Tech`, `Sports`) |
| `author` | string | Filter by partial author name match (case-insensitive) |
| `q` | string | Keyword search in article titles (case-insensitive) |
| `page` | number | Page number (default: 1) |
| `size` | number | Items per page (default: 10) |

---

## 📁 Project Structure

```
-Eskalate-backend-assessment/
│
├── prisma/
│   └── schema.prisma            # Database schema (User, Article, ReadLog, DailyAnalytics)
│
├── src/
│   ├── server.ts                # Entry point — connects DB, starts workers, listens
│   ├── app.ts                   # Express app — middleware stack, routes, error handling
│   │
│   ├── config/                  # Configuration layer
│   │   ├── environment.ts       #   Centralized env var parsing with typed defaults
│   │   ├── database.ts          #   Prisma client singleton (hot-reload safe)
│   │   └── redis.ts             #   Redis connection for BullMQ
│   │
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             #   Enums, JWT payload, response interfaces, query types
│   │
│   ├── utils/                   # Shared utilities
│   │   ├── logger.ts            #   Structured logger with timestamps
│   │   ├── response.ts          #   sendSuccess, sendError, sendPaginated helpers
│   │   └── errors.ts            #   Custom error classes (AppError, NotFound, Forbidden, etc.)
│   │
│   ├── middleware/              # Express middleware
│   │   ├── authenticate.ts      #   JWT verification (required + optional for guests)
│   │   ├── authorize.ts         #   Role-Based Access Control (RBAC)
│   │   ├── validate.ts          #   Centralized Zod schema validation
│   │   ├── errorHandler.ts      #   Global error handler (no stack trace leaks)
│   │   └── notFoundHandler.ts   #   404 catch-all
│   │
│   ├── validators/              # Request validation schemas (Zod)
│   │   ├── auth.validator.ts    #   Signup & Login validation rules
│   │   ├── article.validator.ts #   Article CRUD & query validation rules
│   │   └── index.ts             #   Barrel exports
│   │
│   ├── services/                # Business logic layer
│   │   ├── auth.service.ts      #   Registration (BCrypt) + Login (JWT generation)
│   │   ├── article.service.ts   #   CRUD, soft delete, public feed with filters
│   │   ├── analytics.service.ts #   Read tracking, daily aggregation, dashboard data
│   │   └── index.ts
│   │
│   ├── controllers/             # Request handlers (thin — delegates to services)
│   │   ├── auth.controller.ts
│   │   ├── article.controller.ts
│   │   ├── dashboard.controller.ts
│   │   └── index.ts
│   │
│   ├── routes/                  # Route definitions with middleware chains
│   │   ├── auth.routes.ts       #   POST /auth/signup, /auth/login
│   │   ├── article.routes.ts    #   All /articles endpoints with RBAC
│   │   ├── dashboard.routes.ts  #   GET /author/dashboard
│   │   └── index.ts             #   Main router aggregator
│   │
│   ├── jobs/                    # Background job processing
│   │   ├── queues.ts            #   BullMQ queue definitions
│   │   └── workers.ts           #   Worker processors + midnight GMT cron
│   │
│   └── __tests__/               # Unit tests
│       └── setup.ts             #   Global mocks (Prisma, Redis, BullMQ)
│
├── .env.example                 # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 🧪 Testing

Unit tests mock the database (Prisma) and job queue (BullMQ/Redis) so they run **without any external dependencies**.

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

---

## 🏗️ Architecture Highlights

| Requirement | Implementation |
|---|---|
| **Strong Passwords** | Zod regex enforcing 8+ chars with uppercase, lowercase, digit, and special character |
| **Salted Password Hashing** | BCrypt with 12 salt rounds |
| **JWT Claims** | Token contains `sub` (userId) and `role` — expires in 24 hours |
| **Role-Based Access Control** | `authorize()` middleware factory accepts allowed roles |
| **Soft Deletion** | `deletedAt` timestamp — all public queries filter `deletedAt = null` |
| **Non-Blocking Read Tracking** | Fire-and-forget promise in the article controller — never delays the API response |
| **Daily Analytics Aggregation** | BullMQ cron job runs at midnight GMT, upserts into DailyAnalytics |
| **Standardized Responses** | All endpoints return `{ Success, Message, Object, Errors }` format |
| **No Stack Trace Leaks** | Global error handler strips internal details from client responses |
| **Centralized Validation** | Single Zod schema per endpoint, applied via reusable middleware |
| **Read Spam Prevention** | Configurable rate limit window prevents a user from inflating read counts by refreshing |
