import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config/environment';
import { JwtPayload, UserRole } from '../types';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { SignupInput, LoginInput } from '../validators';

const SALT_ROUNDS = 12;

export class AuthService {
    /**
     * Register a new user
     */
    static async signup(data: SignupInput) {
        // Check for duplicate email
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictError('A user with this email already exists');
        }

        // Hash password with salt
        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return user;
    }

    /**
     * Authenticate user and return JWT
     */
    static async login(data: LoginInput) {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Generate JWT
        const payload: JwtPayload = {
            sub: user.id,
            role: user.role as UserRole,
        };

        const token = jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
        });

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
}
