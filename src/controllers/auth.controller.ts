import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { sendSuccess } from '../utils/response';

export class AuthController {
    /**
     * POST /auth/signup
     */
    static async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await AuthService.signup(req.body);
            sendSuccess(res, 'User registered successfully', user, 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /auth/login
     */
    static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.login(req.body);
            sendSuccess(res, 'Login successful', result);
        } catch (error) {
            next(error);
        }
    }
}
