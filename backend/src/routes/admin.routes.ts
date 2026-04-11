import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import AppSetting from '../models/AppSetting';
import Category from '../models/Category';
import ProviderMediaComment from '../models/ProviderMediaComment';
import ProviderPreference, { ProviderPlan } from '../models/ProviderPreference';
import ProviderModerationReview from '../models/ProviderModerationReview';
import Service from '../models/Service';
import ServiceProvider from '../models/ServiceProvider';
import ServiceRequest from '../models/ServiceRequest';
import User from '../models/User';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../models/AppNotification';

const router = Router();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

const defaultSettings = {
  platformName: 'Professional Services Platform',
  seoTitle: 'Professional Services Platform',
  seoDescription: 'Marketplace for professional services',
  maintenanceMode: false,
  maintenanceMessage: 'Platform is under maintenance',
  systemNotificationsEnabled: true,
};

const getOrCreateProviderPreference = async (
  providerId: string
): Promise<ProviderPreference> => {
  const repo = AppDataSource.getRepository(ProviderPreference);

  const existing = await repo.findOne({
    where: { providerId },
  });

  if (existing) {
    return existing;
  }

  const pref = repo.create({
    providerId,
    selectedPlan: ProviderPlan.BASIC,
    featuredOnHomepage: false,
    profileBadgeText: null,
    autoReplyEnabled: false,
    autoReplyTone: 'professional',
    autoReplySignature: null,
    privacyShowEmail: false,
    privacyShowPhone: true,
    privacyShowAddress: false,
  });

  return await repo.save(pref);
};

router.get(
  '/dashboard-summary',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const providerRepo = AppDataSource.getRepository(ServiceProvider);
      const serviceRepo = AppDataSource.getRepository(Service);
      const requestRepo = AppDataSource.getRepository(ServiceRequest);
      const reviewRepo = AppDataSource.getRepository(ProviderModerationReview);
      const commentRepo = AppDataSource.getRepository(ProviderMediaComment);

      const [
        totalUsers,
        totalCustomers,
        totalProvidersUsers,
        totalReviewers,
        totalAdmins,
        totalProviders,
        pendingProviders,
        approvedProviders,
        totalServices,
        totalRequests,
        totalComments,
      ] = await Promise.all([
        userRepo.count(),
        userRepo.count({ where: { role: 'customer' as any } }),
        userRepo.count({ where: { role: 'service_provider' as any } }),
        userRepo.count({ where: { role: 'reviewer' as any } }),
        userRepo.count({ where: { role: 'admin' as any } }),
        providerRepo.count(),
        providerRepo.count({ where: { status: 'pending' as any } }),
        providerRepo.count({ where: { status: 'approved' as any } }),
        serviceRepo.count(),
        requestRepo.count(),
        commentRepo.count(),
      ]);

      const latestProviders = await providerRepo.find({
        relations: ['user', 'primaryCategory'],
        order: { createdAt: 'DESC' },
        take: 6,
      });

      const latestModeration = await reviewRepo.find({
        relations: ['provider', 'reviewer'],
        order: { createdAt: 'DESC' },
        take: 6,
      });

      res.status(200).json({
        status: 'success',
        message: 'Admin dashboard summary fetched successfully',
        data: {
          kpis: {
            totalUsers,
            totalCustomers,
            totalProvidersUsers,
            totalReviewers,
            totalAdmins,
            totalProviders,
            pendingProviders,
            approvedProviders,
            totalServices,
            totalRequests,
            totalComments,
          },
          charts: {
            roles: [
              { label: 'Customers', value: totalCustomers },
              { label: 'Providers', value: totalProvidersUsers },
              { label: 'Reviewers', value: totalReviewers },
              { label: 'Admins', value: totalAdmins },
            ],
            providerStatuses: [
              { label: 'Pending', value: pendingProviders },
              { label: 'Approved', value: approvedProviders },
            ],
          },
          latestProviders: latestProviders.map((provider) => ({
            id: provider.id,
            companyName: provider.companyName,
            status: provider.status,
            isVerified: provider.isVerified,
            city: provider.city,
            wilaya: provider.wilaya,
            createdAt: provider.createdAt,
            owner: {
              firstName: provider.user.firstName,
              lastName: provider.user.lastName,
              email: provider.user.email,
            },
          })),
          latestModeration: latestModeration.map((item) => ({
            id: item.id,
            decision: item.decision,
            note: item.note,
            createdAt: item.createdAt,
            provider: {
              id: item.provider.id,
              companyName: item.provider.companyName,
            },
            reviewer: {
              id: item.reviewer.id,
              firstName: item.reviewer.firstName,
              lastName: item.reviewer.lastName,
            },
          })),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch admin dashboard summary',
      });
    }
  }
);

router.get(
  '/users',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const search = String(req.query.search || '').trim().toLowerCase();
      const role = String(req.query.role || '').trim();
      const status = String(req.query.status || '').trim();

      const users = await AppDataSource.getRepository(User).find({
        order: { createdAt: 'DESC' },
      });

      const filtered = users.filter((user) => {
        if (role && role !== 'all' && user.role !== role) return false;
        if (status === 'active' && !user.isActive) return false;
        if (status === 'inactive' && user.isActive) return false;

        if (!search) return true;

        const haystack = [
          user.firstName,
          user.lastName,
          user.email,
          user.phoneNumber || '',
          user.role,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });

      res.status(200).json({
        status: 'success',
        message: 'Users fetched successfully',
        data: filtered,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users',
      });
    }
  }
);

router.patch(
  '/users/:id/status',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body;

      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      user.isActive = Boolean(isActive);
      await repo.save(user);

      res.status(200).json({
        status: 'success',
        message: 'User status updated successfully',
        data: user,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user status',
      });
    }
  }
);

router.patch(
  '/users/:id/role',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { role } = req.body;

      const allowedRoles = ['customer', 'service_provider', 'reviewer', 'admin'];

      if (!allowedRoles.includes(String(role))) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid role',
        });
        return;
      }

      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({ where: { id } });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      user.role = String(role) as any;
      await repo.save(user);

      res.status(200).json({
        status: 'success',
        message: 'User role updated successfully',
        data: user,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update user role',
      });
    }
  }
);

router.get(
  '/providers',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const search = String(req.query.search || '').trim().toLowerCase();
      const status = String(req.query.status || '').trim();

      const providers = await AppDataSource.getRepository(ServiceProvider).find({
        relations: ['user', 'primaryCategory'],
        order: { createdAt: 'DESC' },
      });

      const prefRepo = AppDataSource.getRepository(ProviderPreference);

      const items = await Promise.all(
        providers.map(async (provider) => {
          const pref = await prefRepo.findOne({
            where: { providerId: provider.id },
          });

          return {
            id: provider.id,
            companyName: provider.companyName,
            avatarUrl: provider.avatarUrl,
            status: provider.status,
            isVerified: provider.isVerified,
            city: provider.city,
            wilaya: provider.wilaya,
            region: provider.region,
            createdAt: provider.createdAt,
            owner: {
              id: provider.user.id,
              firstName: provider.user.firstName,
              lastName: provider.user.lastName,
              email: provider.user.email,
            },
            primaryCategory: provider.primaryCategory
              ? {
                  id: provider.primaryCategory.id,
                  name: provider.primaryCategory.name,
                  slug: provider.primaryCategory.slug,
                }
              : null,
            preference: pref
              ? {
                  featuredOnHomepage: pref.featuredOnHomepage,
                  profileBadgeText: pref.profileBadgeText,
                  selectedPlan: pref.selectedPlan,
                }
              : {
                  featuredOnHomepage: false,
                  profileBadgeText: null,
                  selectedPlan: 'basic',
                },
          };
        })
      );

      const filtered = items.filter((item) => {
        if (status && status !== 'all' && item.status !== status) return false;
        if (!search) return true;

        const haystack = [
          item.companyName,
          item.city || '',
          item.wilaya || '',
          item.region || '',
          item.owner.firstName,
          item.owner.lastName,
          item.owner.email,
          item.primaryCategory?.name || '',
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });

      res.status(200).json({
        status: 'success',
        message: 'Providers fetched successfully',
        data: filtered,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch providers',
      });
    }
  }
);

router.patch(
  '/providers/:id/moderation',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.id);
      const { status, isVerified, featuredOnHomepage, profileBadgeText } = req.body;

      const providerRepo = AppDataSource.getRepository(ServiceProvider);
      const provider = await providerRepo.findOne({
        where: { id: providerId },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider not found',
        });
        return;
      }

      if (status) {
        provider.status = String(status) as any;
      }

      if (typeof isVerified === 'boolean') {
        provider.isVerified = isVerified;
      }

      await providerRepo.save(provider);

      const pref = await getOrCreateProviderPreference(providerId);

      if (typeof featuredOnHomepage === 'boolean') {
        pref.featuredOnHomepage = featuredOnHomepage;
      }

      if (profileBadgeText !== undefined) {
        pref.profileBadgeText = String(profileBadgeText).trim() || null;
      }

      await AppDataSource.getRepository(ProviderPreference).save(pref);

      await createNotification({
        recipientUserId: provider.userId,
        actorUserId: req.user!.userId,
        type: NotificationType.SYSTEM,
        title: 'تحديث إداري على حساب المزود',
        body: `تم تحديث حالة حسابك إلى ${provider.status}${
          provider.isVerified ? ' — وتم تفعيل التوثيق' : ''
        }`,
        link: '/provider/dashboard',
        metadataJson: {
          providerId: provider.id,
          status: provider.status,
          isVerified: provider.isVerified,
          featuredOnHomepage: pref.featuredOnHomepage,
          profileBadgeText: pref.profileBadgeText,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider moderation updated successfully',
        data: {
          providerStatus: provider.status,
          isVerified: provider.isVerified,
          featuredOnHomepage: pref.featuredOnHomepage,
          profileBadgeText: pref.profileBadgeText,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update provider moderation',
      });
    }
  }
);

router.get(
  '/categories',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const items = await AppDataSource.getRepository(Category).find();

      res.status(200).json({
        status: 'success',
        message: 'Categories fetched successfully',
        data: items,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories',
      });
    }
  }
);

router.post(
  '/categories',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { name, slug, description, parentId } = req.body;

      if (!name || !String(name).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Category name is required',
        });
        return;
      }

      const repo = AppDataSource.getRepository(Category);

      const item = repo.create({
        name: String(name).trim(),
        slug: String(slug || slugify(String(name))).trim(),
        description: description ? String(description).trim() : null,
        parentId: parentId || null,
      } as any);

      await repo.save(item);

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: item,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create category',
      });
    }
  }
);

router.put(
  '/categories/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { name, slug, description, parentId } = req.body;

      const repo = AppDataSource.getRepository(Category);
      const item = await repo.findOne({ where: { id } as any });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      if (name !== undefined) (item as any).name = String(name).trim();
      if (slug !== undefined) (item as any).slug = String(slug).trim();
      if (description !== undefined) (item as any).description = String(description).trim() || null;
      if (parentId !== undefined) (item as any).parentId = parentId || null;

      await repo.save(item);

      res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: item,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category',
      });
    }
  }
);

router.delete(
  '/categories/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const repo = AppDataSource.getRepository(Category);

      const item = await repo.findOne({ where: { id } as any });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
        return;
      }

      await repo.remove(item);

      res.status(200).json({
        status: 'success',
        message: 'Category deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete category',
      });
    }
  }
);

router.get(
  '/content/comments',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const search = String(req.query.search || '').trim().toLowerCase();

      const items = await AppDataSource.getRepository(ProviderMediaComment).find({
        relations: ['media'],
        order: { createdAt: 'DESC' },
        take: 100,
      });

      const filtered = items.filter((item) => {
        if (!search) return true;

        const haystack = [
          item.authorName || '',
          item.body || '',
          item.media?.title || '',
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });

      res.status(200).json({
        status: 'success',
        message: 'Content comments fetched successfully',
        data: filtered.map((item) => ({
          id: item.id,
          authorName: item.authorName,
          body: item.body,
          createdAt: item.createdAt,
          media: item.media
            ? {
                id: item.media.id,
                title: item.media.title,
                providerId: item.media.providerId,
              }
            : null,
        })),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch content comments',
      });
    }
  }
);

router.delete(
  '/content/comments/:id',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const repo = AppDataSource.getRepository(ProviderMediaComment);

      const item = await repo.findOne({
        where: { id },
      });

      if (!item) {
        res.status(404).json({
          status: 'error',
          message: 'Comment not found',
        });
        return;
      }

      await repo.remove(item);

      res.status(200).json({
        status: 'success',
        message: 'Comment deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete content comment',
      });
    }
  }
);

router.get(
  '/reviewers',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const items = await AppDataSource.getRepository(User).find({
        where: { role: 'reviewer' as any },
        order: { createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Reviewers fetched successfully',
        data: items,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reviewers',
      });
    }
  }
);

router.post(
  '/reviewers/promote',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { userId, email } = req.body;

      const repo = AppDataSource.getRepository(User);

      let user: User | null = null;

      if (userId) {
        user = await repo.findOne({ where: { id: String(userId) } });
      } else if (email) {
        user = await repo.findOne({
          where: { email: String(email).trim() } as any,
        });
      }

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Target user not found',
        });
        return;
      }

      if (user.id === req.user!.userId) {
        res.status(400).json({
          status: 'error',
          message: 'You cannot convert your own admin account into reviewer',
        });
        return;
      }

      if (user.role === 'admin' || user.role === 'super_admin') {
        res.status(400).json({
          status: 'error',
          message: 'Admin accounts cannot be promoted to reviewer from this action',
        });
        return;
      }

      if (user.role === 'reviewer') {
        res.status(200).json({
          status: 'success',
          message: 'User is already a reviewer',
          data: user,
        });
        return;
      }

      user.role = 'reviewer' as any;
      await repo.save(user);

      await createNotification({
        recipientUserId: user.id,
        actorUserId: req.user!.userId,
        type: NotificationType.SYSTEM,
        title: 'تم تعيينك كمراجع',
        body: 'تمت ترقية حسابك إلى Reviewer داخل المنصة.',
        link: '/reviewer/dashboard',
        metadataJson: {
          role: 'reviewer',
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'User promoted to reviewer successfully',
        data: user,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to promote reviewer',
      });
    }
  }
);

router.patch(
  '/reviewers/:id/status',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const { isActive } = req.body;

      const repo = AppDataSource.getRepository(User);
      const user = await repo.findOne({
        where: { id, role: 'reviewer' as any } as any,
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Reviewer not found',
        });
        return;
      }

      user.isActive = Boolean(isActive);
      await repo.save(user);

      res.status(200).json({
        status: 'success',
        message: 'Reviewer status updated successfully',
        data: user,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update reviewer status',
      });
    }
  }
);

router.get(
  '/settings',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (_req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AppSetting);
      let item = await repo.findOne({
        where: { key: 'general' },
      });

      if (!item) {
        item = repo.create({
          key: 'general',
          valueJson: defaultSettings,
        });

        await repo.save(item);
      }

      res.status(200).json({
        status: 'success',
        message: 'App settings fetched successfully',
        data: item.valueJson || defaultSettings,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch app settings',
      });
    }
  }
);

router.put(
  '/settings',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AppSetting);
      let item = await repo.findOne({
        where: { key: 'general' },
      });

      if (!item) {
        item = repo.create({
          key: 'general',
          valueJson: defaultSettings,
        });
      }

      item.valueJson = {
        ...((item.valueJson as Record<string, unknown>) || defaultSettings),
        ...((req.body as Record<string, unknown>) || {}),
      };

      await repo.save(item);

      res.status(200).json({
        status: 'success',
        message: 'App settings updated successfully',
        data: item.valueJson,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update app settings',
      });
    }
  }
);

export default router;