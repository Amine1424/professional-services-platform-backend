import { Request, Response, Router } from 'express';
import { Brackets, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import ProviderMedia, {
  ProviderMediaStoryAudience,
  ProviderMediaType,
} from '../models/ProviderMedia';
import ProviderMediaLike from '../models/ProviderMediaLike';
import ProviderMediaComment from '../models/ProviderMediaComment';
import ServiceProvider from '../models/ServiceProvider';
import ProviderPreference, { ProviderPlan } from '../models/ProviderPreference';
import Service from '../models/Service';
import User from '../models/User';
import FavoriteProvider from '../models/FavoriteProvider';
import { createManyNotifications, createNotification } from '../services/notificationService';
import { NotificationType } from '../models/AppNotification';
import Conversation, { ConversationStatus } from '../models/Conversation';
import ConversationMessage from '../models/ConversationMessage';
import {
  cleanupLocalUploadedFile,
  createUploadMiddleware,
  getUploadErrorMessage,
  resolveUploadedFileUrl,
  UPLOAD_FOLDERS,
} from '../services/upload.service';
import { imageAndVideoFilter, removeLocalUploadByUrl } from '../utils/uploads';

const router = Router();
const providerPortfolioUpload = createUploadMiddleware(
  (req) => ['providers', req.user?.userId || 'anonymous', 'portfolio'],
  imageAndVideoFilter
);

const STORY_TTL_HOURS = 24;

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

const isTruthy = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
};

const normalizeStoryAudience = (value: unknown): ProviderMediaStoryAudience => {
  return String(value || '').trim() === ProviderMediaStoryAudience.FAVORITES_ONLY
    ? ProviderMediaStoryAudience.FAVORITES_ONLY
    : ProviderMediaStoryAudience.PUBLIC;
};

const buildStoryExpiresAt = () =>
  new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);

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

const getUploadedPortfolioFiles = (req: Request) => {
  const files = req.files as
    | {
        mediaFile?: Express.Multer.File[];
        thumbnailFile?: Express.Multer.File[];
      }
    | undefined;

  return {
    mediaFile: files?.mediaFile?.[0],
    thumbnailFile: files?.thumbnailFile?.[0],
  };
};

const cleanupUploadedPortfolioFiles = (req: Request) => {
  const { mediaFile, thumbnailFile } = getUploadedPortfolioFiles(req);

  if (mediaFile) {
    cleanupLocalUploadedFile(mediaFile);
  }

  if (thumbnailFile) {
    cleanupLocalUploadedFile(thumbnailFile);
  }
};

const resolveMediaType = (
  rawMediaType: unknown,
  mediaFile?: Express.Multer.File
): ProviderMediaType => {
  if (
    rawMediaType &&
    Object.values(ProviderMediaType).includes(rawMediaType as ProviderMediaType)
  ) {
    return rawMediaType as ProviderMediaType;
  }

  if (mediaFile?.mimetype.startsWith('video/')) {
    return ProviderMediaType.VIDEO;
  }

  return ProviderMediaType.IMAGE;
};

const validatePortfolioFiles = (
  mediaType: ProviderMediaType,
  mediaFile?: Express.Multer.File,
  thumbnailFile?: Express.Multer.File
) => {
  if (!mediaFile) {
    return null;
  }

  if (mediaType === ProviderMediaType.IMAGE && !mediaFile.mimetype.startsWith('image/')) {
    return 'Image items require an image file';
  }

  if (mediaType === ProviderMediaType.VIDEO && !mediaFile.mimetype.startsWith('video/')) {
    return 'Video items require a video file';
  }

  if (thumbnailFile && !thumbnailFile.mimetype.startsWith('image/')) {
    return 'Video thumbnail must be an image file';
  }

  return null;
};

const mapStoryFeedItem = (item: ProviderMedia) => ({
  id: item.id,
  providerId: item.providerId,
  providerName: item.provider?.companyName || 'Provider',
  providerAvatarUrl: item.provider?.avatarUrl || null,
  providerLocation: [item.provider?.city, item.provider?.wilaya, item.provider?.region]
    .filter(Boolean)
    .join(', '),
  mediaType: item.mediaType,
  mediaUrl: item.mediaUrl,
  thumbnailUrl: item.thumbnailUrl,
  title: item.title,
  description: item.description,
  likesCount: item.likesCount,
  commentsCount: item.commentsCount,
  promoBadgeText: item.promoBadgeText,
  showPromoBadge: item.showPromoBadge,
  storyAudience: item.storyAudience,
  storyExpiresAt: item.storyExpiresAt,
  service: item.service
    ? {
        id: item.service.id,
        name: item.service.name,
      }
    : null,
});

const ensureConversationForStoryReply = async (
  customerUserId: string,
  providerId: string,
  serviceId: string | null,
  subject: string
) => {
  const conversationRepo = AppDataSource.getRepository(Conversation);

  const query = conversationRepo
    .createQueryBuilder('conversation')
    .where('conversation.customer_user_id = :customerUserId', { customerUserId })
    .andWhere('conversation.provider_id = :providerId', { providerId });

  if (serviceId) {
    query.andWhere('conversation.service_id = :serviceId', { serviceId });
  } else {
    query.andWhere('conversation.service_id IS NULL');
  }

  let conversation = await query.getOne();

  if (!conversation) {
    conversation = conversationRepo.create({
      customerUserId,
      providerId,
      serviceId,
      subject,
      status: ConversationStatus.OPEN,
      lastMessagePreview: null,
      lastMessageAt: null,
      lastReadCustomerAt: null,
      lastReadProviderAt: null,
    });

    await conversationRepo.save(conversation);
  }

  return conversation;
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
        isStory: false,
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

router.get(
  '/provider/:providerId/interactions',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.providerId);
      const mediaRepo = AppDataSource.getRepository(ProviderMedia);
      const likesRepo = AppDataSource.getRepository(ProviderMediaLike);

      const mediaItems = await mediaRepo.find({
        where: { providerId },
        select: {
          id: true,
        },
      });

      const mediaIds = mediaItems.map((item) => item.id);

      if (!mediaIds.length) {
        res.status(200).json({
          status: 'success',
          message: 'Viewer interactions fetched successfully',
          data: {
            likedMediaIds: [],
          },
        });
        return;
      }

      const likes = await likesRepo.find({
        where: {
          userId: req.user!.userId,
          mediaId: In(mediaIds),
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Viewer interactions fetched successfully',
        data: {
          likedMediaIds: likes.map((item) => item.mediaId),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch viewer interactions',
      });
    }
  }
);

router.post(
  '/',
  authMiddleware,
  authorizeRole('service_provider'),
  providerPortfolioUpload.fields([
    { name: 'mediaFile', maxCount: 1 },
    { name: 'thumbnailFile', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const provider = await getProviderForCurrentUser(req.user!.userId);

      if (!provider) {
        cleanupUploadedPortfolioFiles(req);
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);
      const features = planFeatures(preference.selectedPlan);
      const { mediaFile, thumbnailFile } = getUploadedPortfolioFiles(req);

      const {
        serviceId,
        mediaType,
        title,
        description,
        isPublished,
        isFeatured,
        showPromoBadge,
        promoBadgeText,
        sortOrder,
        isStory,
        storyAudience,
      } = req.body;

      if (!title || !String(title).trim()) {
        cleanupUploadedPortfolioFiles(req);
        res.status(400).json({
          status: 'error',
          message: 'Media title is required',
        });
        return;
      }

      const effectiveMediaType = resolveMediaType(mediaType, mediaFile);

      if (!mediaFile) {
        cleanupUploadedPortfolioFiles(req);
        res.status(400).json({
          status: 'error',
          message: 'Upload an image or video file from your device',
        });
        return;
      }

      const filesError = validatePortfolioFiles(
        effectiveMediaType,
        mediaFile,
        thumbnailFile
      );

      if (filesError) {
        cleanupUploadedPortfolioFiles(req);
        res.status(400).json({
          status: 'error',
          message: filesError,
        });
        return;
      }

      if (serviceId) {
        const service = await AppDataSource.getRepository(Service).findOne({
          where: { id: serviceId, providerId: provider.id },
        });

        if (!service) {
          cleanupUploadedPortfolioFiles(req);
          res.status(400).json({
            status: 'error',
            message: 'Selected service does not belong to this provider',
          });
          return;
        }
      }

      if (isTruthy(isFeatured) && !features.canFeatureServices) {
        cleanupUploadedPortfolioFiles(req);
        res.status(403).json({
          status: 'error',
          message: 'Featured media requires Pro or Business plan',
        });
        return;
      }

      if (isTruthy(showPromoBadge) && !features.canUseServicePromoBadge) {
        cleanupUploadedPortfolioFiles(req);
        res.status(403).json({
          status: 'error',
          message: 'Promo badge on media requires Pro or Business plan',
        });
        return;
      }

      const shouldPublishAsStory = isTruthy(isStory);
      const normalizedStoryAudience = normalizeStoryAudience(storyAudience);
      const mediaFolder = shouldPublishAsStory
        ? UPLOAD_FOLDERS.stories
        : UPLOAD_FOLDERS.portfolio;
      const mediaUpload = await resolveUploadedFileUrl(mediaFile, {
        folder: mediaFolder,
        resourceType: 'auto',
      });
      const thumbnailUpload = thumbnailFile
        ? await resolveUploadedFileUrl(thumbnailFile, {
            folder: mediaFolder,
            resourceType: 'image',
          })
        : null;

      const media = AppDataSource.getRepository(ProviderMedia).create({
        providerId: provider.id,
        serviceId: serviceId || null,
        mediaType: effectiveMediaType,
        mediaUrl: mediaUpload.secureUrl,
        thumbnailUrl: thumbnailUpload?.secureUrl || null,
        title: String(title).trim(),
        description: String(description || '').trim() || null,
        isPublished: isPublished !== undefined ? isTruthy(isPublished) : true,
        isFeatured: features.canFeatureServices ? isTruthy(isFeatured) : false,
        showPromoBadge: features.canUseServicePromoBadge ? isTruthy(showPromoBadge) : false,
        promoBadgeText: features.canUseServicePromoBadge
          ? String(promoBadgeText || '').trim() || null
          : null,
        sortOrder: Number(sortOrder) || 0,
        isStory: shouldPublishAsStory,
        storyAudience: shouldPublishAsStory
          ? normalizedStoryAudience
          : ProviderMediaStoryAudience.PUBLIC,
        storyExpiresAt: shouldPublishAsStory ? buildStoryExpiresAt() : null,
      });

      await AppDataSource.getRepository(ProviderMedia).save(media);

      const created = await AppDataSource.getRepository(ProviderMedia).findOne({
        where: { id: media.id },
        relations: ['service', 'provider'],
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
              title: created.isStory
                ? `ستوري جديدة من ${provider.companyName}`
                : `تحديث جديد من ${provider.companyName}`,
              body: created.title,
              link: created.isStory
                ? `/providers/${provider.id}?storyId=${created.id}`
                : `/providers/${provider.id}`,
              metadataJson: {
                providerId: provider.id,
                mediaId: created.id,
                isStory: created.isStory,
                storyAudience: created.storyAudience,
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
    } catch (error) {
      cleanupUploadedPortfolioFiles(req);
      res.status(500).json({
        status: 'error',
        message: getUploadErrorMessage(error, 'Failed to create provider media'),
      });
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRole('service_provider'),
  providerPortfolioUpload.fields([
    { name: 'mediaFile', maxCount: 1 },
    { name: 'thumbnailFile', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const mediaId = String(req.params.id);
      const provider = await getProviderForCurrentUser(req.user!.userId);

      if (!provider) {
        cleanupUploadedPortfolioFiles(req);
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
        cleanupUploadedPortfolioFiles(req);
        res.status(404).json({
          status: 'error',
          message: 'Media item not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);
      const features = planFeatures(preference.selectedPlan);
      const { mediaFile, thumbnailFile } = getUploadedPortfolioFiles(req);

      const {
        serviceId,
        mediaType,
        title,
        description,
        isPublished,
        isFeatured,
        showPromoBadge,
        promoBadgeText,
        sortOrder,
        isStory,
        storyAudience,
      } = req.body;

      if (serviceId) {
        const service = await AppDataSource.getRepository(Service).findOne({
          where: { id: serviceId, providerId: provider.id },
        });

        if (!service) {
          cleanupUploadedPortfolioFiles(req);
          res.status(400).json({
            status: 'error',
            message: 'Selected service does not belong to this provider',
          });
          return;
        }
      }

      const effectiveMediaType =
        mediaType !== undefined || mediaFile
          ? resolveMediaType(mediaType, mediaFile)
          : media.mediaType;

      const filesError = validatePortfolioFiles(
        effectiveMediaType,
        mediaFile,
        thumbnailFile
      );

      if (filesError) {
        cleanupUploadedPortfolioFiles(req);
        res.status(400).json({
          status: 'error',
          message: filesError,
        });
        return;
      }

      if (isFeatured !== undefined && isTruthy(isFeatured) && !features.canFeatureServices) {
        cleanupUploadedPortfolioFiles(req);
        res.status(403).json({
          status: 'error',
          message: 'Featured media requires Pro or Business plan',
        });
        return;
      }

      if (
        showPromoBadge !== undefined &&
        isTruthy(showPromoBadge) &&
        !features.canUseServicePromoBadge
      ) {
        cleanupUploadedPortfolioFiles(req);
        res.status(403).json({
          status: 'error',
          message: 'Promo badge on media requires Pro or Business plan',
        });
        return;
      }

      const previousIsStory = media.isStory;
      const nextIsStory =
        isStory !== undefined ? isTruthy(isStory) : media.isStory;
      const nextStoryAudience =
        storyAudience !== undefined
          ? normalizeStoryAudience(storyAudience)
          : media.storyAudience;

      media.serviceId = serviceId !== undefined ? serviceId || null : media.serviceId;
      media.mediaType = effectiveMediaType;

      const previousMediaUrl = media.mediaUrl;
      const previousThumbnailUrl = media.thumbnailUrl;
      const mediaFolder = nextIsStory
        ? UPLOAD_FOLDERS.stories
        : UPLOAD_FOLDERS.portfolio;

      if (mediaFile) {
        const mediaUpload = await resolveUploadedFileUrl(mediaFile, {
          folder: mediaFolder,
          resourceType: 'auto',
        });
        media.mediaUrl = mediaUpload.secureUrl;
      }

      if (thumbnailFile) {
        const thumbnailUpload = await resolveUploadedFileUrl(thumbnailFile, {
          folder: mediaFolder,
          resourceType: 'image',
        });
        media.thumbnailUrl = thumbnailUpload.secureUrl;
      }

      media.title = title !== undefined ? String(title).trim() : media.title;
      media.description =
        description !== undefined
          ? String(description).trim() || null
          : media.description;
      media.isPublished =
        isPublished !== undefined ? isTruthy(isPublished) : media.isPublished;
      media.isFeatured =
        isFeatured !== undefined
          ? features.canFeatureServices
            ? isTruthy(isFeatured)
            : false
          : media.isFeatured;
      media.showPromoBadge =
        showPromoBadge !== undefined
          ? features.canUseServicePromoBadge
            ? isTruthy(showPromoBadge)
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

      media.isStory = nextIsStory;
      media.storyAudience = nextIsStory
        ? nextStoryAudience
        : ProviderMediaStoryAudience.PUBLIC;

      if (!nextIsStory) {
        media.storyExpiresAt = null;
      } else if (!previousIsStory || !media.storyExpiresAt) {
        media.storyExpiresAt = buildStoryExpiresAt();
      }

      await mediaRepo.save(media);

      if (mediaFile && previousMediaUrl && previousMediaUrl !== media.mediaUrl) {
        removeLocalUploadByUrl(previousMediaUrl);
      }

      if (
        thumbnailFile &&
        previousThumbnailUrl &&
        previousThumbnailUrl !== media.thumbnailUrl
      ) {
        removeLocalUploadByUrl(previousThumbnailUrl);
      }

      const updated = await mediaRepo.findOne({
        where: { id: media.id },
        relations: ['service'],
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider media updated successfully',
        data: updated,
      });
    } catch (error) {
      cleanupUploadedPortfolioFiles(req);
      res.status(500).json({
        status: 'error',
        message: getUploadErrorMessage(error, 'Failed to update provider media'),
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

      const mediaUrl = media.mediaUrl;
      const thumbnailUrl = media.thumbnailUrl;

      await mediaRepo.remove(media);
      removeLocalUploadByUrl(mediaUrl);
      removeLocalUploadByUrl(thumbnailUrl);

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

router.get(
  '/stories/favorites',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const favoriteProviderIds = (
        await AppDataSource.getRepository(FavoriteProvider).find({
          where: { userId: req.user!.userId },
        })
      ).map((item) => item.providerId);

      const mediaRepo = AppDataSource.getRepository(ProviderMedia);

      const qb = mediaRepo
        .createQueryBuilder('media')
        .leftJoinAndSelect('media.provider', 'provider')
        .leftJoinAndSelect('media.service', 'service')
        .where('media.is_published = :isPublished', { isPublished: true })
        .andWhere('media.is_story = :isStory', { isStory: true })
        .andWhere('media.story_expires_at IS NOT NULL')
        .andWhere('media.story_expires_at > :now', { now: new Date() })
        .andWhere(
          new Brackets((storyQb) => {
            storyQb.where('media.story_audience = :publicAudience', {
              publicAudience: ProviderMediaStoryAudience.PUBLIC,
            });

            if (favoriteProviderIds.length) {
              storyQb.orWhere(
                new Brackets((favoriteQb) => {
                  favoriteQb
                    .where('media.story_audience = :favoritesAudience', {
                      favoritesAudience: ProviderMediaStoryAudience.FAVORITES_ONLY,
                    })
                    .andWhere('media.provider_id IN (:...favoriteProviderIds)', {
                      favoriteProviderIds,
                    });
                })
              );
            }
          })
        )
        .orderBy('media.created_at', 'DESC')
        .limit(24);

      const items = await qb.getMany();

      res.status(200).json({
        status: 'success',
        message: 'Favorite stories fetched successfully',
        data: items.map(mapStoryFeedItem),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch favorite stories',
      });
    }
  }
);

router.post(
  '/stories/:id/reply',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const storyId = String(req.params.id);
      const customerUserId = req.user!.userId;
      const { body } = req.body;

      if (!body || !String(body).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Reply body is required',
        });
        return;
      }

      const story = await AppDataSource.getRepository(ProviderMedia).findOne({
        where: {
          id: storyId,
          isPublished: true,
          isStory: true,
        },
        relations: ['provider', 'service'],
      });

      if (!story || !story.storyExpiresAt || story.storyExpiresAt <= new Date()) {
        res.status(404).json({
          status: 'error',
          message: 'Story not found or expired',
        });
        return;
      }

      if (story.storyAudience === ProviderMediaStoryAudience.FAVORITES_ONLY) {
        const favorite = await AppDataSource.getRepository(FavoriteProvider).findOne({
          where: {
            userId: customerUserId,
            providerId: story.providerId,
          },
        });

        if (!favorite) {
          res.status(403).json({
            status: 'error',
            message: 'This story is visible to favorite followers only',
          });
          return;
        }
      }

      const conversation = await ensureConversationForStoryReply(
        customerUserId,
        story.providerId,
        story.serviceId || null,
        story.service?.name || story.provider.companyName
      );

      const messageBody = `Reply to story: ${story.title}\n\n${String(body).trim()}`;

      const message = AppDataSource.getRepository(ConversationMessage).create({
        conversationId: conversation.id,
        senderUserId: customerUserId,
        senderRole: 'customer',
        body: messageBody,
        isAiAssisted: false,
      });

      await AppDataSource.getRepository(ConversationMessage).save(message);

      conversation.lastMessagePreview = messageBody.slice(0, 500);
      conversation.lastMessageAt = new Date();
      conversation.lastReadCustomerAt = new Date();

      await AppDataSource.getRepository(Conversation).save(conversation);

      if (story.provider.userId) {
        await createNotification({
          recipientUserId: story.provider.userId,
          actorUserId: customerUserId,
          type: NotificationType.MESSAGE,
          title: 'Reply to story from a customer',
          body: `${story.title}: ${String(body).trim().slice(0, 140)}`,
          link: `/provider/messages?conversationId=${conversation.id}`,
          metadataJson: {
            conversationId: conversation.id,
            providerId: story.providerId,
            mediaId: story.id,
            isStoryReply: true,
          },
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Story reply sent successfully',
        data: {
          conversationId: conversation.id,
          messageId: message.id,
          redirectTo: `/customer/messages?conversationId=${conversation.id}`,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send story reply',
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
