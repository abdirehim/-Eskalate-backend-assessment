import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { articleRoutes } from './article.routes';
import { dashboardRoutes } from './dashboard.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/articles', articleRoutes);
apiRouter.use('/author', dashboardRoutes);

export { apiRouter };
