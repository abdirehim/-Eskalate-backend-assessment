import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { apiRouter } from './routes';

const app = express();

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ─── Body Parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───────────────────────────────────────────────────────
if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
}

// ─── Health Check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({
        Success: true,
        Message: 'API is running',
        Object: { status: 'healthy', timestamp: new Date().toISOString() },
        Errors: null,
    });
});

// ─── API Routes ────────────────────────────────────────────────────
app.use('/api/v1', apiRouter);

// ─── Error Handling ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
