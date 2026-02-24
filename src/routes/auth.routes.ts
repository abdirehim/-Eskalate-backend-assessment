import { Router } from 'express';
import { AuthController } from '../controllers';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../validators';

const router = Router();

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login', validate(loginSchema), AuthController.login);

export { router as authRoutes };
