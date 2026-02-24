import { Router } from 'express';
import { ArticleController } from '../controllers';
import { authenticate, optionalAuth } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { UserRole } from '../types';
import {
    createArticleSchema,
    updateArticleSchema,
    articleIdParamSchema,
    articleQuerySchema,
} from '../validators';

const router = Router();

// ─── Author-Only Routes (must be before /:id to avoid conflict) ───
// GET /articles/me — Author's own articles
router.get(
    '/me',
    authenticate,
    authorize(UserRole.AUTHOR),
    ArticleController.getMyArticles
);

// ─── Public Routes ─────────────────────────────────────────────────
// GET /articles — Public news feed (published, non-deleted, with filters)
router.get('/', validate(articleQuerySchema), ArticleController.getPublicFeed);

// GET /articles/:id — Read single article (optional auth for read tracking)
router.get('/:id', validate(articleIdParamSchema), optionalAuth, ArticleController.getById);

// ─── Author-Only Mutation Routes ───────────────────────────────────
// POST /articles — Create article
router.post(
    '/',
    authenticate,
    authorize(UserRole.AUTHOR),
    validate(createArticleSchema),
    ArticleController.create
);

// PUT /articles/:id — Update article
router.put(
    '/:id',
    authenticate,
    authorize(UserRole.AUTHOR),
    validate(updateArticleSchema),
    ArticleController.update
);

// DELETE /articles/:id — Soft delete article
router.delete(
    '/:id',
    authenticate,
    authorize(UserRole.AUTHOR),
    validate(articleIdParamSchema),
    ArticleController.delete
);

export { router as articleRoutes };
