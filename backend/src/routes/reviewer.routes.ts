import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import AppNotification, { NotificationType } from '../models/AppNotification';
import ProviderMedia from '../models/ProviderMedia';
import ProviderModerationReview, {
  ModerationDecision,
} from '../models/ProviderModerationReview';
import ProviderReview from '../models/ProviderReview';
import Service from '../models/Service';
import ServiceProvider, { ProviderStatus } from '../models/ServiceProvider';
import ServiceRequest from '../models/ServiceRequest';
import User from '../models/User';
import { createNotification } from '../services/notificationService';

const router = Router();

const reviewerRoles = ['reviewer', 'admin', 'super_admin'] as const;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const getProviderStatusFromDecision = (decision: ModerationDecision): ProviderStatus => {
  switch (decision) {
    case ModerationDecision.APPROVED:
      return ProviderStatus.APPROVED;
    case ModerationDecision.REJECTED:
      return ProviderStatus.REJECTED;
    case ModerationDecision.SUSPENDED:
      return ProviderStatus.SUSPENDED;
    case ModerationDecision.REQUEST_INFO:
    default:
      return ProviderStatus.PENDING;
  }
};

const buildDashboardSummary = async () => {
  const providerRepository = AppDataSource.getRepository(ServiceProvider);
  const moderationRepository = AppDataSource.getRepository(ProviderModerationReview);

  const [providers, moderationItems] = await Promise.all([
    providerRepository.find({
      relations: ['user', 'primaryCategory', 'services'],
      order: { createdAt: 'DESC' },
    }),
    moderationRepository.find({
      relations: ['provider', 'reviewer'],
      order: { createdAt: 'DESC' },
    }),
  ]);

  const pendingProviders = providers.filter(
    (provider) => provider.status === ProviderStatus.PENDING
  );
  const approvedProviders = providers.filter(
    (provider) => provider.status === ProviderStatus.APPROVED
  );
  const rejectedProviders = providers.filter(
    (provider) => provider.status === ProviderStatus.REJECTED
  );
  const suspendedProviders = providers.filter(
    (provider) => provider.status === ProviderStatus.SUSPENDED
  );

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  const moderationToday = moderationItems.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return createdAt >= todayStart && createdAt <= todayEnd;
  });

  const approvedCount = moderationItems.filter(
    (item) => item.decision === ModerationDecision.APPROVED
  ).length;
  const approvalRate = moderationItems.length
    ? Math.round((approvedCount / moderationItems.length) * 100)
    : 0;

  return {
    stats: {
      totalProviders: providers.length,
      pendingProviders: pendingProviders.length,
      approvedProviders: approvedProviders.length,
      rejectedProviders: rejectedProviders.length,
      suspendedProviders: suspendedProviders.length,
    },
    latestPending: pendingProviders.slice(0, 8).map((provider) => ({
      id: provider.id,
      companyName: provider.companyName,
      city: provider.city,
      wilaya: provider.wilaya,
      region: provider.region,
      status: provider.status,
      isVerified: provider.isVerified,
      createdAt: provider.createdAt,
      owner: {
        firstName: provider.user?.firstName || '',
        lastName: provider.user?.lastName || '',
        email: provider.user?.email || '',
      },
      primaryCategory: provider.primaryCategory
        ? {
            id: provider.primaryCategory.id,
            name: provider.primaryCategory.name,
          }
        : null,
      servicesCount: provider.services?.length || 0,
    })),
    summary: {
      pendingCount: pendingProviders.length,
      reviewedToday: moderationToday.length,
      totalReviewed: moderationItems.length,
      approvedCount,
      approvalRate,
    },
  };
};

const saveModerationDecision = async ({
  providerId,
  reviewerUserId,
  decision,
  note,
  checklistJson,
}: {
  providerId: string;
  reviewerUserId: string;
  decision: ModerationDecision;
  note?: string | null;
  checklistJson?: Record<string, boolean> | null;
}) => {
  const providerRepository = AppDataSource.getRepository(ServiceProvider);
  const moderationRepository = AppDataSource.getRepository(ProviderModerationReview);

  const provider = await providerRepository.findOne({
    where: { id: providerId },
    relations: ['user', 'primaryCategory'],
  });

  if (!provider) {
    return null;
  }

  provider.status = getProviderStatusFromDecision(decision);
  provider.isVerified = decision === ModerationDecision.APPROVED;
  await providerRepository.save(provider);

  const moderationReview = moderationRepository.create({
    providerId,
    reviewerUserId,
    decision,
    note: note || null,
    checklistJson: checklistJson || null,
  });

  await moderationRepository.save(moderationReview);

  await createNotification({
    recipientUserId: provider.userId,
    actorUserId: reviewerUserId,
    type: NotificationType.SYSTEM,
    title: 'Provider review updated',
    body: `Your account review status is now ${provider.status}.`,
    link: '/provider/dashboard',
    metadataJson: {
      providerId: provider.id,
      decision,
      status: provider.status,
      isVerified: provider.isVerified,
    },
  });

  return provider;
};

router.get(
  '/dashboard',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (_req: Request, res: Response) => {
    try {
      const payload = await buildDashboardSummary();

      res.status(200).json({
        status: 'success',
        message: 'Reviewer dashboard fetched successfully',
        data: payload,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reviewer dashboard',
      });
    }
  }
);

router.get(
  '/dashboard-summary',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (_req: Request, res: Response) => {
    try {
      const payload = await buildDashboardSummary();

      res.status(200).json({
        status: 'success',
        message: 'Reviewer dashboard summary fetched successfully',
        data: payload.summary,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reviewer dashboard summary',
      });
    }
  }
);

router.get(
  '/profile',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (req: Request, res: Response) => {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const moderationRepository = AppDataSource.getRepository(ProviderModerationReview);

      const [user, moderationItems] = await Promise.all([
        userRepository.findOne({
          where: { id: req.user!.userId },
        }),
        moderationRepository.find({
          where: { reviewerUserId: req.user!.userId },
          order: { createdAt: 'DESC' },
        }),
      ]);

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Reviewer not found',
        });
        return;
      }

      const todayStart = startOfToday();
      const todayEnd = endOfToday();
      const reviewedToday = moderationItems.filter((item) => {
        const createdAt = new Date(item.createdAt);
        return createdAt >= todayStart && createdAt <= todayEnd;
      }).length;

      res.status(200).json({
        status: 'success',
        message: 'Reviewer profile fetched successfully',
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          stats: {
            totalReviewed: moderationItems.length,
            reviewedToday,
            approvedCount: moderationItems.filter(
              (item) => item.decision === ModerationDecision.APPROVED
            ).length,
          },
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reviewer profile',
      });
    }
  }
);

router.get(
  '/pending',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (_req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);

      const pendingProviders = await providerRepository.find({
        where: { status: ProviderStatus.PENDING },
        relations: ['user', 'primaryCategory', 'services'],
        order: { createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Pending providers fetched successfully',
        data: pendingProviders.map((provider) => ({
          id: provider.id,
          companyName: provider.companyName,
          description: provider.description,
          city: provider.city,
          wilaya: provider.wilaya,
          region: provider.region,
          yearsOfExperience: provider.yearsOfExperience,
          status: provider.status,
          isVerified: provider.isVerified,
          createdAt: provider.createdAt,
          owner: {
            firstName: provider.user?.firstName || '',
            lastName: provider.user?.lastName || '',
            email: provider.user?.email || '',
          },
          primaryCategory: provider.primaryCategory
            ? {
                id: provider.primaryCategory.id,
                name: provider.primaryCategory.name,
              }
            : null,
          servicesCount: provider.services?.length || 0,
        })),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch pending providers',
      });
    }
  }
);

router.get(
  '/history',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (_req: Request, res: Response) => {
    try {
      const moderationRepository = AppDataSource.getRepository(ProviderModerationReview);

      const moderationItems = await moderationRepository.find({
        relations: ['provider', 'reviewer'],
        order: { createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Reviewer history fetched successfully',
        data: moderationItems.map((item) => ({
          id: item.id,
          decision: item.decision,
          note: item.note,
          createdAt: item.createdAt,
          provider: item.provider
            ? {
                id: item.provider.id,
                companyName: item.provider.companyName,
                status: item.provider.status,
              }
            : null,
          reviewer: item.reviewer
            ? {
                id: item.reviewer.id,
                firstName: item.reviewer.firstName,
                lastName: item.reviewer.lastName,
              }
            : null,
        })),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reviewer history',
      });
    }
  }
);

router.get(
  '/providers/:id',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.id);
      const providerRepository = AppDataSource.getRepository(ServiceProvider);
      const serviceRepository = AppDataSource.getRepository(Service);
      const mediaRepository = AppDataSource.getRepository(ProviderMedia);
      const reviewRepository = AppDataSource.getRepository(ProviderReview);
      const moderationRepository = AppDataSource.getRepository(ProviderModerationReview);
      const requestRepository = AppDataSource.getRepository(ServiceRequest);
      const userRepository = AppDataSource.getRepository(User);

      const provider = await providerRepository.findOne({
        where: { id: providerId },
        relations: ['user', 'primaryCategory'],
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider not found',
        });
        return;
      }

      const [services, media, reviews, requestsCount, moderationHistory, users] =
        await Promise.all([
          serviceRepository.find({
            where: { providerId },
            order: { createdAt: 'DESC' },
          }),
          mediaRepository.find({
            where: { providerId },
            order: { createdAt: 'DESC' },
          }),
          reviewRepository.find({
            where: { providerId },
            order: { createdAt: 'DESC' },
          }),
          requestRepository.count({
            where: { providerId },
          }),
          moderationRepository.find({
            where: { providerId },
            relations: ['reviewer'],
            order: { createdAt: 'DESC' },
          }),
          userRepository.find(),
        ]);

      const userMap = new Map(users.map((user) => [user.id, user]));

      res.status(200).json({
        status: 'success',
        message: 'Provider review details fetched successfully',
        data: {
          provider: {
            id: provider.id,
            companyName: provider.companyName,
            description: provider.description,
            city: provider.city,
            wilaya: provider.wilaya,
            region: provider.region,
            addressLine: provider.addressLine,
            yearsOfExperience: provider.yearsOfExperience,
            responseTimeMinutes: provider.responseTimeMinutes,
            averageRating: provider.averageRating,
            reviewsCount: provider.reviewsCount,
            status: provider.status,
            isVerified: provider.isVerified,
            owner: {
              firstName: provider.user?.firstName || '',
              lastName: provider.user?.lastName || '',
              email: provider.user?.email || '',
              phoneNumber: provider.user?.phoneNumber || null,
            },
            primaryCategory: provider.primaryCategory
              ? {
                  name: provider.primaryCategory.name,
                }
              : null,
          },
          services: services.map((service) => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: service.price,
          })),
          media: media.map((item) => ({
            id: item.id,
            title: item.title,
            mediaType: item.mediaType,
            mediaUrl: item.mediaUrl,
          })),
          reviews: reviews.map((item) => ({
            id: item.id,
            rating: item.rating,
            comment: item.comment,
            authorName: userMap.get(item.userId)
              ? `${userMap.get(item.userId)!.firstName} ${userMap.get(item.userId)!.lastName}`.trim()
              : 'Customer',
          })),
          requestsCount,
          moderationHistory: moderationHistory.map((item) => ({
            id: item.id,
            decision: item.decision,
            note: item.note,
            createdAt: item.createdAt,
            reviewer: {
              firstName: item.reviewer?.firstName || '',
              lastName: item.reviewer?.lastName || '',
            },
          })),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider review details',
      });
    }
  }
);

router.post(
  '/providers/:id/decision',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.id);
      const { decision, note, checklistJson } = req.body;

      if (!Object.values(ModerationDecision).includes(decision as ModerationDecision)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid moderation decision',
        });
        return;
      }

      const updatedProvider = await saveModerationDecision({
        providerId,
        reviewerUserId: req.user!.userId,
        decision: decision as ModerationDecision,
        note: note ? String(note).trim() : null,
        checklistJson:
          checklistJson && typeof checklistJson === 'object' ? checklistJson : null,
      });

      if (!updatedProvider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: 'Reviewer decision saved successfully',
        data: {
          providerId: updatedProvider.id,
          status: updatedProvider.status,
          isVerified: updatedProvider.isVerified,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to save reviewer decision',
      });
    }
  }
);

router.patch(
  '/providers/:id/status',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.id);
      const { status } = req.body;

      const decisionMap: Record<string, ModerationDecision> = {
        approved: ModerationDecision.APPROVED,
        rejected: ModerationDecision.REJECTED,
        suspended: ModerationDecision.SUSPENDED,
      };

      if (!decisionMap[String(status)]) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid status. Use approved, rejected, or suspended',
        });
        return;
      }

      const updatedProvider = await saveModerationDecision({
        providerId,
        reviewerUserId: req.user!.userId,
        decision: decisionMap[String(status)],
        note: null,
        checklistJson: null,
      });

      if (!updatedProvider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: 'Provider status updated successfully',
        data: {
          id: updatedProvider.id,
          status: updatedProvider.status,
          isVerified: updatedProvider.isVerified,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update provider status',
      });
    }
  }
);

router.get(
  '/notifications',
  authMiddleware,
  authorizeRole(...reviewerRoles),
  async (req: Request, res: Response) => {
    try {
      const notifications = await AppDataSource.getRepository(AppNotification).find({
        where: { recipientUserId: req.user!.userId },
        order: { createdAt: 'DESC' },
        take: 30,
      });

      res.status(200).json({
        status: 'success',
        message: 'Reviewer notifications fetched successfully',
        data: notifications,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch reviewer notifications',
      });
    }
  }
);

export default router;
