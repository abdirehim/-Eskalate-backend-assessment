import { z } from 'zod';

export const createArticleSchema = z.object({
    body: z.object({
        title: z
            .string({ required_error: 'Title is required' })
            .min(1, 'Title is required')
            .max(150, 'Title must be at most 150 characters'),
        content: z
            .string({ required_error: 'Content is required' })
            .min(50, 'Content must be at least 50 characters'),
        category: z
            .string({ required_error: 'Category is required' })
            .min(1, 'Category is required'),
        status: z
            .enum(['Draft', 'Published'])
            .optional()
            .default('Draft'),
    }),
});

export const updateArticleSchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(1, 'Title cannot be empty')
            .max(150, 'Title must be at most 150 characters')
            .optional(),
        content: z
            .string()
            .min(50, 'Content must be at least 50 characters')
            .optional(),
        category: z
            .string()
            .min(1, 'Category cannot be empty')
            .optional(),
        status: z
            .enum(['Draft', 'Published'])
            .optional(),
    }),
    params: z.object({
        id: z.string().uuid('Invalid article ID format'),
    }),
});

export const articleIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid article ID format'),
    }),
});

export const articleQuerySchema = z.object({
    query: z.object({
        category: z.string().optional(),
        author: z.string().optional(),
        q: z.string().optional(),
        page: z.string().optional().default('1'),
        size: z.string().optional().default('10'),
    }),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>['body'];
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['body'];
