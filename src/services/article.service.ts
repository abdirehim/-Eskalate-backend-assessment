import { prisma } from '../config/database';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateArticleInput, UpdateArticleInput } from '../validators';
import { ArticleQueryFilters } from '../types';

export class ArticleService {
    /**
     * Create a new article (Author only)
     */
    static async create(authorId: string, data: CreateArticleInput) {
        const article = await prisma.article.create({
            data: {
                title: data.title,
                content: data.content,
                category: data.category,
                status: data.status || 'Draft',
                authorId,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return article;
    }

    /**
     * Get all articles by the authenticated author (including drafts)
     */
    static async getMyArticles(
        authorId: string,
        page: number = 1,
        size: number = 10,
        includeDeleted: boolean = false
    ) {
        const where: any = { authorId };

        if (!includeDeleted) {
            where.deletedAt = null;
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip: (page - 1) * size,
                take: size,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, name: true },
                    },
                },
            }),
            prisma.article.count({ where }),
        ]);

        return { articles, total };
    }

    /**
     * Update an article (Author must own it)
     */
    static async update(articleId: string, authorId: string, data: UpdateArticleInput) {
        const article = await prisma.article.findUnique({
            where: { id: articleId },
        });

        if (!article || article.deletedAt) {
            throw new NotFoundError('Article not found');
        }

        if (article.authorId !== authorId) {
            throw new ForbiddenError('You can only edit your own articles');
        }

        const updated = await prisma.article.update({
            where: { id: articleId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.content && { content: data.content }),
                ...(data.category && { category: data.category }),
                ...(data.status && { status: data.status }),
            },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
        });

        return updated;
    }

    /**
     * Soft delete an article (set deletedAt timestamp)
     */
    static async softDelete(articleId: string, authorId: string) {
        const article = await prisma.article.findUnique({
            where: { id: articleId },
        });

        if (!article || article.deletedAt) {
            throw new NotFoundError('Article not found');
        }

        if (article.authorId !== authorId) {
            throw new ForbiddenError('You can only delete your own articles');
        }

        await prisma.article.update({
            where: { id: articleId },
            data: { deletedAt: new Date() },
        });

        return { message: 'Article deleted successfully' };
    }

    /**
     * Public news feed — only published, non-deleted articles
     * Supports filtering by category, author name, and keyword search
     */
    static async getPublicFeed(filters: ArticleQueryFilters) {
        const page = parseInt(filters.page || '1', 10);
        const size = parseInt(filters.size || '10', 10);

        const where: any = {
            status: 'Published',
            deletedAt: null,
        };

        // Category filter (exact match)
        if (filters.category) {
            where.category = filters.category;
        }

        // Author filter (partial name match)
        if (filters.author) {
            where.author = {
                name: {
                    contains: filters.author,
                    mode: 'insensitive',
                },
            };
        }

        // Keyword search in title
        if (filters.q) {
            where.title = {
                contains: filters.q,
                mode: 'insensitive',
            };
        }

        const [articles, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip: (page - 1) * size,
                take: size,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, name: true },
                    },
                },
            }),
            prisma.article.count({ where }),
        ]);

        return { articles, total, page, size };
    }

    /**
     * Get single article by ID (for reading)
     * Returns null if deleted
     */
    static async getById(articleId: string) {
        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: {
                author: {
                    select: { id: true, name: true },
                },
            },
        });

        return article;
    }
}
