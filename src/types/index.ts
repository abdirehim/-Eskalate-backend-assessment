import { Request } from 'express';

// ─── Enums ─────────────────────────────────────────────────────────
export enum UserRole {
    AUTHOR = 'author',
    READER = 'reader',
}

export enum ArticleStatus {
    DRAFT = 'Draft',
    PUBLISHED = 'Published',
}

// ─── JWT Payload ───────────────────────────────────────────────────
export interface JwtPayload {
    sub: string; // userId
    role: UserRole;
    iat?: number;
    exp?: number;
}

// ─── Authenticated Request ─────────────────────────────────────────
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

// ─── API Response Types ────────────────────────────────────────────
export interface BaseResponse<T = unknown> {
    Success: boolean;
    Message: string;
    Object: T | null;
    Errors: string[] | null;
}

export interface PaginatedResponse<T = unknown> {
    Success: boolean;
    Message: string;
    Object: T[];
    PageNumber: number;
    PageSize: number;
    TotalSize: number;
    Errors: null;
}

// ─── Pagination Query ──────────────────────────────────────────────
export interface PaginationQuery {
    page?: string;
    size?: string;
}

// ─── Article Query Filters ─────────────────────────────────────────
export interface ArticleQueryFilters extends PaginationQuery {
    category?: string;
    author?: string;
    q?: string;
}

// ─── Dashboard Item ────────────────────────────────────────────────
export interface DashboardArticleItem {
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: Date;
    totalViews: number;
}
