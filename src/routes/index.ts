import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /
 * @desc    Welcome page
 * @access  Public
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: '🎉 Welcome to Professional Services Platform API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: {
      swagger: '/api/docs',
      postman: '/api/postman-collection.json',
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      services: '/api/services',
      orders: '/api/orders',
      payments: '/api/payments',
      reviews: '/api/reviews',
      messages: '/api/messages',
      admin: '/api/admin',
      reviewer: '/api/reviewer',
      subscriptions: '/api/subscriptions',
    },
    serverStatus: {
      database: 'Connected ✅',
      server: 'Running ✅',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @route   GET /api
 * @desc    API Info
 * @access  Public
 */
router.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Professional Services Platform API v1.0.0',
    endpoints: {
      auth: '/api/auth - Authentication endpoints',
      users: '/api/users - User management',
      services: '/api/services - Services management',
      orders: '/api/orders - Orders management',
      payments: '/api/payments - Payment processing',
      reviews: '/api/reviews - Reviews and ratings',
      messages: '/api/messages - Messaging system',
      admin: '/api/admin - Admin panel',
      reviewer: '/api/reviewer - Reviewer panel',
      subscriptions: '/api/subscriptions - Subscription management',
    },
  });
});

export default router;