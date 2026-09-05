import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { ENV } from './config/env';
import { connectDatabase } from './config/database';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { documentRouter } from './routes/document.routes';
import { lessonRouter } from './routes/lesson.routes';
import { teachingRouter } from './routes/teaching.routes';
import { assessmentRouter } from './routes/assessment.routes';
import { voiceRouter } from './routes/voice.routes';
import { videoRouter } from './routes/video.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { userRouter } from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/appError';

export function createServer(): Express {
  const app = express();

  // Security & standard middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allows flexible SVG and media streaming in dev
  }));
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Rate Limiter to protect from DoS / API abuse (1000 requests per 15 min window)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please retry later.' } },
  });
  app.use('/api', apiLimiter);

  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Mount API routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/documents', documentRouter);
  app.use('/api/lessons', lessonRouter);
  app.use('/api/teaching', teachingRouter);
  app.use('/api/assessment', assessmentRouter);
  app.use('/api/voice', voiceRouter);
  app.use('/api/video', videoRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/user', userRouter);

  // 404 Handler
  app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createServer();

export async function startServer(): Promise<void> {
  await connectDatabase();

  const server = app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 AI Teacher Express API running on port ${ENV.PORT}`);
    console.log(`📚 Health check: http://localhost:${ENV.PORT}/api/health`);
    console.log(`====================================================`);
  });

  const shutdown = () => {
    console.log('\n[Server] Gracefully shutting down...');
    server.close(() => {
      console.log('[Server] Closed remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start if executed directly
if (require.main === module) {
  startServer();
}
