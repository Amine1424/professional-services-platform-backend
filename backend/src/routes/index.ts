import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   GET /api
 * @desc    API root info
 * @access  Public
 *
 * ملاحظة:
 * هذا الملف مركب داخل app.ts تحت /api
 * لذلك route "/" هنا تعني فعليًا "/api"
 */
router.get('/', (_req: Request, res: Response) => {
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
      health: '/api/health',
      auth: '/api/auth',
      categories: '/api/categories',
      services: '/api/services',
      orders: '/api/orders',
      messages: '/api/messages',
      notifications: '/api/notifications',
      providers: '/api/providers',
      providerMedia: '/api/provider-media',
      publicProviders: '/api/public-providers',
      providerReviews: '/api/provider-reviews',
      discovery: '/api/discovery',
      customers: '/api/customers',
      favorites: '/api/favorites',
      admin: '/api/admin',
      adminRegions: '/api/admin/regions',
      adminReports: '/api/admin/reports',
      reviewer: '/api/reviewer',
      reviewThreads: '/api/review-threads',
    },
    serverStatus: {
      database: 'Connected ✅',
      server: 'Running ✅',
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @route   GET /api/meta
 * @desc    Detailed API summary
 * @access  Public
 */
router.get('/meta', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Professional Services Platform API v1.0.0',
    modules: {
      auth: '/api/auth - Authentication and onboarding',
      categories: '/api/categories - Categories and taxonomy',
      services: '/api/services - Provider services management',
      orders: '/api/orders - Requests, leads, and order lifecycle',
      messages: '/api/messages - Conversations and messages',
      notifications: '/api/notifications - App notifications',
      providers: '/api/providers - Provider workspace and profile management',
      providerMedia: '/api/provider-media - Portfolio/media and interactions',
      publicProviders: '/api/public-providers - Public provider profiles',
      providerReviews: '/api/provider-reviews - Reviews and ratings',
      discovery: '/api/discovery - Explore, search, home feed',
      customers: '/api/customers - Customer workspace endpoints',
      favorites: '/api/favorites - Favorite providers',
      admin: '/api/admin - Admin workspace',
      adminRegions: '/api/admin/regions - Regions and wilayas management',
      adminReports: '/api/admin/reports - Reporting and exports',
      reviewer: '/api/reviewer - Reviewer workspace',
      reviewThreads: '/api/review-threads - Review inbox and discussion threads',
    },
  });
});

export default router;