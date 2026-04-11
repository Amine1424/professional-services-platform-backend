import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import ProviderMedia, { ProviderMediaType } from '../models/ProviderMedia';
import ProviderMediaLike from '../models/ProviderMediaLike';
import ProviderMediaComment from '../models/ProviderMediaComment';
import ServiceProvider from '../models/ServiceProvider';
import ProviderPreference, { ProviderPlan } from '../models/ProviderPreference';
import Service from '../models/Service';
import User from '../models/User';
import FavoriteProvider from '../models/FavoriteProvider';
import { createManyNotifications, createNotification } from '../services/notificationService';
import { NotificationType } from '../models/AppNotification';

const router = Router();

const ensureProviderPreference = async (providerId: string) => {
  const repository = AppDataSource.getRepository(ProviderPreference);

  let preference = await repository.findOne({
    where: { providerId },
  });

  if (!preference) {
    preference = repository.create({
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

    await repository.save(preference);
  }

  return preference;
};

const planFeatures = (plan: ProviderPlan) => ({
  canUseProfileBadge: plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS,
  canUseServicePromoBadge: plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS,
  canFeatureOnHomepage: plan === ProviderPlan.BUSINESS,
  canFeatureServices: plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS,
});

const refreshMediaCounts = async (mediaId: string) => {
  const mediaRepo = AppDataSource.getRepository(ProviderMedia);
  const likesRepo = AppDataSource.getRepository(ProviderMediaLike);
  const commentsRepo = AppDataSource.getRepository(ProviderMediaComment);

  const likesCount = await likesRepo.count({
    where: { mediaId },
  });

  const commentsCount = await commentsRepo.count({
    where: { mediaId, isVisible: true },
  });

  await mediaRepo.update(mediaId, {
    likesCount,
    commentsCount,
  });
};

const getProviderForCurrentUser = async (userId: string) => {
  return await AppDataSource.getRepository(ServiceProvider).findOne({
    where: { userId },
  });
};

router.get(
  '/me',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const provider = await getProviderForCurrentUser(req.user!.userId);

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      const items = await AppDataSource.getRepository(ProviderMedia).find({
        where: { providerId: provider.id },
        relations: ['service'],
        order: {
          sortOrder: 'ASC',
          createdAt: 'DESC',
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider media fetched successfully',
        data: {
          items,
          preference,
          planFeatures: planFeatures(preference.selectedPlan),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider media',
      });
    }
  }
);

router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const providerId = String(req.params.providerId);

    const items = await AppDataSource.getRepository(ProviderMedia).find({
      where: {
        providerId,
        isPublished: true,
      },
      relations: ['service'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Public provider media fetched successfully',
      data: items,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch public provider media',
    });
  }
});

router.post(
  '/',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const provider = await getProviderForCurrentUser(req.user!.userId);

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);
      const features = planFeatures(preference.selectedPlan);

      const {
        serviceId,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        title,
        description,
        isPublished,
        isFeatured,
        showPromoBadge,
        promoBadgeText,
        sortOrder,
      } = req.body;

      if (!title || !String(title).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Media title is required',
        });
        return;
      }

      if (!mediaUrl || !String(mediaUrl).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Media URL is required',
        });
        return;
      }

      if (
        mediaType &&
        !Object.values(ProviderMediaType).includes(mediaType as ProviderMediaType)
      ) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid media type',
        });
        return;
      }

      if (serviceId) {
        const service = await AppDataSource.getRepository(Service).findOne({
          where: { id: serviceId, providerId: provider.id },
        });

        if (!service) {
          res.status(400).json({
            status: 'error',
            message: 'Selected service does not belong to this provider',
          });
          return;
        }
      }

      if (Boolean(isFeatured) && !features.canFeatureServices) {
        res.status(403).json({
          status: 'error',
          message: 'Featured media requires Pro or Business plan',
        });
        return;
      }

      if (Boolean(showPromoBadge) && !features.canUseServicePromoBadge) {
        res.status(403).json({
          status: 'error',
          message: 'Promo badge on media requires Pro or Business plan',
        });
        return;
      }

      const media = AppDataSource.getRepository(ProviderMedia).create({
        providerId: provider.id,
        serviceId: serviceId || null,
        mediaType:
          mediaType && Object.values(ProviderMediaType).includes(mediaType)
            ? mediaType
            : ProviderMediaType.IMAGE,
        mediaUrl: String(mediaUrl).trim(),
        thumbnailUrl: String(thumbnailUrl || '').trim() || null,
        title: String(title).trim(),
        description: String(description || '').trim() || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        isFeatured: features.canFeatureServices ? Boolean(isFeatured) : false,
        showPromoBadge: features.canUseServicePromoBadge
          ? Boolean(showPromoBadge)
          : false,
        promoBadgeText: features.canUseServicePromoBadge
          ? String(promoBadgeText || '').trim() || null
          : null,
        sortOrder: Number(sortOrder) || 0,
      });

      await AppDataSource.getRepository(ProviderMedia).save(media);

      const created = await AppDataSource.getRepository(ProviderMedia).findOne({
        where: { id: media.id },
        relations: ['service'],
      });
if (created?.isPublished) {
  const favorites = await AppDataSource.getRepository(FavoriteProvider).find({
    where: { providerId: provider.id },
  });

  if (favorites.length) {
    await createManyNotifications(
      favorites.map((favorite) => ({
        recipientUserId: favorite.userId,
        actorUserId: req.user!.userId,
        type: NotificationType.FAVORITE_PROVIDER_UPDATE,
        title: `تحديث جديد من ${provider.companyName}`,
        body: created.title,
        link: `/providers/${provider.id}`,
        metadataJson: {
          providerId: provider.id,
          mediaId: created.id,
        },
      }))
    );
  }
}
      res.status(201).json({
        status: 'success',
        message: 'Provider media created successfully',
        data: created,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create provider media',
      });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const mediaId = String(req.params.id);
      const provider = await getProviderForCurrentUser(req.user!.userId);

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const mediaRepo = AppDataSource.getRepository(ProviderMedia);
      const media = await mediaRepo.findOne({
        where: { id: mediaId, providerId: provider.id },
      });

      if (!media) {
        res.status(404).json({
          status: 'error',
          message: 'Media item not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);
      const features = planFeatures(preference.selectedPlan);

      const {
        serviceId,
        mediaType,
        mediaUrl,
        thumbnailUrl,
        title,
        description,
        isPublished,
        isFeatured,
        showPromoBadge,
        promoBadgeText,
        sortOrder,
      } = req.body;

      if (serviceId) {
        const service = await AppDataSource.getRepository(Service).findOne({
          where: { id: serviceId, providerId: provider.id },
        });

        if (!service) {
          res.status(400).json({
            status: 'error',
            message: 'Selected service does not belong to this provider',
          });
          return;
        }
      }

      if (Boolean(isFeatured) && !features.canFeatureServices) {
        res.status(403).json({
          status: 'error',
          message: 'Featured media requires Pro or Business plan',
        });
        return;
      }

      if (Boolean(showPromoBadge) && !features.canUseServicePromoBadge) {
        res.status(403).json({
          status: 'error',
          message: 'Promo badge on media requires Pro or Business plan',
        });
        return;
      }

      media.serviceId = serviceId !== undefined ? serviceId || null : media.serviceId;
      media.mediaType =
        mediaType && Object.values(ProviderMediaType).includes(mediaType)
          ? mediaType
          : media.mediaType;
      media.mediaUrl =
        mediaUrl !== undefined ? String(mediaUrl).trim() : media.mediaUrl;
      media.thumbnailUrl =
        thumbnailUrl !== undefined
          ? String(thumbnailUrl).trim() || null
          : media.thumbnailUrl;
      media.title = title !== undefined ? String(title).trim() : media.title;
      media.description =
        description !== undefined
          ? String(description).trim() || null
          : media.description;
      media.isPublished =
        isPublished !== undefined ? Boolean(isPublished) : media.isPublished;
      media.isFeatured =
        isFeatured !== undefined
          ? features.canFeatureServices
            ? Boolean(isFeatured)
            : false
          : media.isFeatured;
      media.showPromoBadge =
        showPromoBadge !== undefined
          ? features.canUseServicePromoBadge
            ? Boolean(showPromoBadge)
            : false
          : media.showPromoBadge;
      media.promoBadgeText =
        promoBadgeText !== undefined
          ? features.canUseServicePromoBadge
            ? String(promoBadgeText).trim() || null
            : null
          : media.promoBadgeText;
      media.sortOrder =
        sortOrder !== undefined ? Number(sortOrder) || 0 : media.sortOrder;

      await mediaRepo.save(media);

      const updated = await mediaRepo.findOne({
        where: { id: media.id },
        relations: ['service'],
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider media updated successfully',
        data: updated,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update provider media',
      });
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRole('service_provider', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const mediaId = String(req.params.id);
      const mediaRepo = AppDataSource.getRepository(ProviderMedia);

      let media: ProviderMedia | null = null;

      if (req.user!.role === 'service_provider') {
        const provider = await getProviderForCurrentUser(req.user!.userId);

        if (!provider) {
          res.status(404).json({
            status: 'error',
            message: 'Provider profile not found',
          });
          return;
        }

        media = await mediaRepo.findOne({
          where: { id: mediaId, providerId: provider.id },
        });
      } else {
        media = await mediaRepo.findOne({
          where: { id: mediaId },
        });
      }

      if (!media) {
        res.status(404).json({
          status: 'error',
          message: 'Media item not found',
        });
        return;
      }

      await mediaRepo.remove(media);

      res.status(200).json({
        status: 'success',
        message: 'Provider media deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete provider media',
      });
    }
  }
);

router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const mediaId = String(req.params.id);

    const comments = await AppDataSource.getRepository(ProviderMediaComment).find({
      where: {
        mediaId,
        isVisible: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Media comments fetched successfully',
      data: comments,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch media comments',
    });
  }
});

router.post(
  '/:id/like',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const mediaId = String(req.params.id);
      const userId = req.user!.userId;

      const media = await AppDataSource.getRepository(ProviderMedia).findOne({
        where: { id: mediaId },
      });

      if (!media) {
        res.status(404).json({
          status: 'error',
          message: 'Media item not found',
        });
        return;
      }

      const likesRepo = AppDataSource.getRepository(ProviderMediaLike);

      const existing = await likesRepo.findOne({
        where: { mediaId, userId },
      });

      if (!existing) {
        const like = likesRepo.create({
          mediaId,
          userId,
        });

        await likesRepo.save(like);
      }

      await refreshMediaCounts(mediaId);

      res.status(200).json({
        status: 'success',
        message: 'Media liked successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to like media',
      });
    }
  }
);

router.delete(
  '/:id/like',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const mediaId = String(req.params.id);
      const userId = req.user!.userId;

      const likesRepo = AppDataSource.getRepository(ProviderMediaLike);

      const existing = await likesRepo.findOne({
        where: { mediaId, userId },
      });

      if (existing) {
        await likesRepo.remove(existing);
      }

      await refreshMediaCounts(mediaId);

      res.status(200).json({
        status: 'success',
        message: 'Media unliked successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to unlike media',
      });
    }
  }
);

router.post(
  '/:id/comments',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const mediaId = String(req.params.id);
      const userId = req.user!.userId;
      const { body } = req.body;

      if (!body || !String(body).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Comment body is required',
        });
        return;
      }

      const media = await AppDataSource.getRepository(ProviderMedia).findOne({
        where: { id: mediaId },
      });

      if (!media) {
        res.status(404).json({
          status: 'error',
          message: 'Media item not found',
        });
        return;
      }

      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: userId },
      });

      const authorName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : 'Utilisateur';

      const comment = AppDataSource.getRepository(ProviderMediaComment).create({
        mediaId,
        userId,
        authorName,
        body: String(body).trim(),
        isVisible: true,
      });

      await AppDataSource.getRepository(ProviderMediaComment).save(comment);
      await refreshMediaCounts(mediaId);
const mediaOwner = await AppDataSource.getRepository(ServiceProvider).findOne({
  where: { id: media.providerId },
  relations: ['user'],
});

if (mediaOwner?.userId && mediaOwner.userId !== userId) {
  await createNotification({
    recipientUserId: mediaOwner.userId,
    actorUserId: userId,
    type: NotificationType.COMMENT,
    title: 'تعليق جديد على عمل منشور',
    body: `${authorName}: ${String(body).trim().slice(0, 140)}`,
    link: `/providers/${media.providerId}`,
    metadataJson: {
      mediaId,
      providerId: media.providerId,
    },
  });
}
      res.status(201).json({
        status: 'success',
        message: 'Comment added successfully',
        data: comment,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add comment',
      });
    }
  }
);

router.delete(
  '/comments/:commentId',
  authMiddleware,
  authorizeRole('service_provider', 'admin', 'super_admin', 'customer', 'reviewer'),
  async (req: Request, res: Response) => {
    try {
      const commentId = String(req.params.commentId);
      const commentRepo = AppDataSource.getRepository(ProviderMediaComment);

      const comment = await commentRepo.findOne({
        where: { id: commentId },
        relations: ['media'],
      });

      if (!comment) {
        res.status(404).json({
          status: 'error',
          message: 'Comment not found',
        });
        return;
      }

      const role = req.user!.role;
      const userId = req.user!.userId;

      let canDelete = false;

      if (role === 'admin' || role === 'super_admin') {
        canDelete = true;
      } else if (comment.userId === userId) {
        canDelete = true;
      } else if (role === 'service_provider') {
        const provider = await getProviderForCurrentUser(userId);
        if (provider && provider.id === comment.media.providerId) {
          canDelete = true;
        }
      }

      if (!canDelete) {
        res.status(403).json({
          status: 'error',
          message: 'You are not allowed to delete this comment',
        });
        return;
      }

      await commentRepo.remove(comment);
      await refreshMediaCounts(comment.mediaId);

      res.status(200).json({
        status: 'success',
        message: 'Comment deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete comment',
      });
    }
  }
);

export default router;