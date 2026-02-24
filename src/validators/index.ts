export { signupSchema, loginSchema } from './auth.validator';
export type { SignupInput, LoginInput } from './auth.validator';

export {
    createArticleSchema,
    updateArticleSchema,
    articleIdParamSchema,
    articleQuerySchema,
} from './article.validator';
export type { CreateArticleInput, UpdateArticleInput } from './article.validator';
