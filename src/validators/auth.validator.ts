import { z } from 'zod';
import { UserRole } from '../types';

/**
 * Name: only alphabets and spaces
 * Password: strong — 8+ chars, uppercase, lowercase, number, special char
 * Email: standard email regex
 */
const nameRegex = /^[A-Za-z\s]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const signupSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: 'Name is required' })
            .min(1, 'Name is required')
            .regex(nameRegex, 'Name must contain only alphabets and spaces'),
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email format'),
        password: z
            .string({ required_error: 'Password is required' })
            .min(8, 'Password must be at least 8 characters')
            .regex(
                passwordRegex,
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            ),
        role: z.nativeEnum(UserRole, {
            required_error: 'Role is required',
            invalid_type_error: 'Role must be either "author" or "reader"',
        }),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email format'),
        password: z
            .string({ required_error: 'Password is required' })
            .min(1, 'Password is required'),
    }),
});

export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
