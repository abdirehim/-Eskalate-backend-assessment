import { Router } from 'express';
import { DashboardController } from '../controllers';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';

const router = Router();

// GET /author/dashboard — Author performance dashboard
router.get(
    '/dashboard',
    authenticate,
    authorize(UserRole.AUTHOR),
    DashboardController.getDashboard
);

export { router as dashboardRoutes };
