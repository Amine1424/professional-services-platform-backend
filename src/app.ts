import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

// تحميل متغيرات البيئة
dotenv.config();

const app: Application = express();

// ============================================
// MIDDLEWARE - الأمان
// ============================================
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use('/', require('./routes/index').default);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: '✅ Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth Routes
app.use('/api/auth', require('./routes/auth.routes').default);

// ... بقية الـ routes كما هي

// ============================================
// MIDDLEWARE - Body Parser
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ============================================
// MIDDLEWARE - Logging
// ============================================
const morganFormat =
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :res[content-length] - :response-time ms';

app.use(morgan(morganFormat));

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static('uploads'));

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: '✅ Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth Routes
app.use('/api/auth', require('./routes/auth.routes').default);

// User Routes
app.use('/api/users', require('./routes/user.routes').default);

// Service Routes
app.use('/api/services', require('./routes/service.routes').default);

// Order Routes
app.use('/api/orders', require('./routes/order.routes').default);

// Payment Routes
app.use('/api/payments', require('./routes/payment.routes').default);

// Review Routes
app.use('/api/reviews', require('./routes/review.routes').default);

// Message Routes
app.use('/api/messages', require('./routes/message.routes').default);

// Admin Routes
app.use('/api/admin', require('./routes/admin.routes').default);

// Reviewer Routes
app.use('/api/reviewer', require('./routes/reviewer.routes').default);

// Subscription Routes
app.use('/api/subscriptions', require('./routes/subscription.routes').default);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: '❌ Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
    ...(process.env.NODE_ENV === 'development' && { 
      error: err,
      stack: err.stack,
    }),
  });
});

export default app;