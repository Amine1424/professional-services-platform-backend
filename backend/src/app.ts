import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import notificationRoutes from './routes/notification.routes';
import indexRoutes from './routes/index';
import authRoutes from './routes/auth.routes';
import categoryRoutes from './routes/category.routes';
import userRoutes from './routes/user.routes';
import serviceRoutes from './routes/service.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import messageRoutes from './routes/message.routes';
import adminRoutes from './routes/admin.routes';
import reviewerRoutes from './routes/reviewer.routes';
import subscriptionRoutes from './routes/subscription.routes';
import providerRoutes from './routes/provider.routes';
import providerMediaRoutes from './routes/provider-media.routes';
import publicProviderRoutes from './routes/public-provider.routes';
import discoveryRoutes from './routes/discovery.routes';
import customerRoutes from './routes/customer.routes';
import favoriteRoutes from './routes/favorite.routes';
import providerReviewRoutes from './routes/provider-review.routes';
import adminRegionRoutes from './routes/admin-region.routes';
import adminReportRoutes from './routes/admin-report.routes';

dotenv.config();

const app: Application = express();

const allowedOrigins = (
  process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// SECURITY
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// LOGGING
const morganFormat =
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :res[content-length] - :response-time ms';

app.use(morgan(morganFormat));

// BODY PARSERS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// STATIC FILES
app.use('/uploads', express.static('uploads'));

// API ROUTES
app.use('/api', indexRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: '✅ Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviewer', reviewerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/provider-media', providerMediaRoutes);
app.use('/api/public-providers', publicProviderRoutes);
app.use('/api/provider-reviews', providerReviewRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/admin/regions', adminRegionRoutes);
app.use('/api/admin/reports', adminReportRoutes);

// FRONTEND BUILD SERVING
const frontendBuildPath = path.resolve(__dirname, '../../frontend/build');
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

if (hasFrontendBuild) {
  app.use(express.static(frontendBuildPath));
}

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }

  if (req.method !== 'GET') {
    next();
    return;
  }

  if (!hasFrontendBuild) {
    res.status(503).json({
      status: 'error',
      message:
        'Frontend build not found. Run frontend build first or use backend npm run dev:full.',
    });
    return;
  }

  res.sendFile(frontendIndexPath);
});

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: '❌ Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// GLOBAL ERROR HANDLER
app.use(
  (
    err: Error & { status?: number; statusCode?: number },
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    logger.error(`Error: ${message}`, {
      status,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });

    res.status(status).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development'
        ? {
            stack: err.stack,
          }
        : {}),
    });
  }
);

export default app;
