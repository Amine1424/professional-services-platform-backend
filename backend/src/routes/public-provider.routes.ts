import { Request, Response, Router } from 'express';
import { In, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { optionalAuthMiddleware } from '../middleware/auth';
import FavoriteProvider from '../models/FavoriteProvider';
import ServiceProvider from '../models/ServiceProvider';
import ProviderPreference from '../models/ProviderPreference';
import Service, { ServiceStatus } from '../models/Service';
import ProviderMedia, { ProviderMediaStoryAudience } from '../models/ProviderMedia';
import ProviderMediaComment from '../models/ProviderMediaComment';
import ServiceRequest, { ServiceRequestStatus } from '../models/ServiceRequest';
import { buildProviderCoverageSummary } from '../utils/algeria';

const router = Router();

router.get('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const providerId = String(req.params.id);

    const providerRepo = AppDataSource.getRepository(ServiceProvider);
    const preferenceRepo = AppDataSource.getRepository(ProviderPreference);
    const serviceRepo = AppDataSource.getRepository(Service);
    const mediaRepo = AppDataSource.getRepository(ProviderMedia);
    const commentRepo = AppDataSource.getRepository(ProviderMediaComment);
    const requestRepo = AppDataSource.getRepository(ServiceRequest);

    const provider = await providerRepo.findOne({
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

    const preference = await preferenceRepo.findOne({
      where: { providerId: provider.id },
    });

    const services = await serviceRepo.find({
      where: {
        providerId: provider.id,
        status: ServiceStatus.PUBLISHED,
      },
      relations: ['category'],
      order: {
        createdAt: 'DESC',
      },
    });

    const media = await mediaRepo.find({
      where: {
        providerId: provider.id,
        isPublished: true,
        isStory: false,
      },
      relations: ['service'],
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });

    const canSeeFavoriteStories = req.user?.role === 'customer'
      ? await AppDataSource.getRepository(FavoriteProvider).findOne({
          where: {
            userId: req.user.userId,
            providerId: provider.id,
          },
        })
      : null;

    const publicStories = await mediaRepo.find({
      where: {
        providerId: provider.id,
        isPublished: true,
        isStory: true,
        storyAudience: ProviderMediaStoryAudience.PUBLIC,
        storyExpiresAt: MoreThan(new Date()),
      },
      relations: ['service'],
      order: {
        createdAt: 'DESC',
      },
    });

    const favoriteStories = canSeeFavoriteStories
      ? await mediaRepo.find({
          where: {
            providerId: provider.id,
            isPublished: true,
            isStory: true,
            storyAudience: ProviderMediaStoryAudience.FAVORITES_ONLY,
            storyExpiresAt: MoreThan(new Date()),
          },
          relations: ['service'],
          order: {
            createdAt: 'DESC',
          },
        })
      : [];

    const visibleStories = [...publicStories, ...favoriteStories]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .filter(
        (item, index, collection) =>
          collection.findIndex((candidate) => candidate.id === item.id) === index
      );

    const [totalRequests, completedJobs, respondedRequests] = await Promise.all([
      requestRepo.count({
        where: {
          providerId: provider.id,
        },
      }),
      requestRepo.count({
        where: {
          providerId: provider.id,
          status: ServiceRequestStatus.COMPLETED,
        },
      }),
      requestRepo.count({
        where: {
          providerId: provider.id,
          status: In([
            ServiceRequestStatus.QUOTED,
            ServiceRequestStatus.ACCEPTED,
            ServiceRequestStatus.REJECTED,
            ServiceRequestStatus.IN_PROGRESS,
            ServiceRequestStatus.COMPLETED,
            ServiceRequestStatus.CANCELLED,
          ]),
        },
      }),
    ]);

    const responseRate =
      totalRequests > 0 ? Math.round((respondedRequests / totalRequests) * 100) : 0;

    const mediaIds = media.map((item) => item.id);

    const comments = mediaIds.length
      ? await commentRepo.find({
          where: {
            mediaId: In(mediaIds),
            isVisible: true,
          },
          order: {
            createdAt: 'DESC',
          },
        })
      : [];

    const latestCommentsByMedia: Record<string, ProviderMediaComment[]> = {};

    for (const comment of comments) {
      if (!latestCommentsByMedia[comment.mediaId]) {
        latestCommentsByMedia[comment.mediaId] = [];
      }

      if (latestCommentsByMedia[comment.mediaId].length < 3) {
        latestCommentsByMedia[comment.mediaId].push(comment);
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Public provider page fetched successfully',
      data: {
        provider: {
          id: provider.id,
          companyName: provider.companyName,
          description: provider.description,
          avatarUrl: provider.avatarUrl,
          coverUrl: provider.coverUrl,
          region: provider.region,
          wilaya: provider.wilaya,
          city: provider.city,
          serviceCoverage: buildProviderCoverageSummary(provider),
          addressLine:
            preference?.privacyShowAddress ? provider.addressLine : null,
          yearsOfExperience: provider.yearsOfExperience,
          averageRating: provider.averageRating,
          reviewsCount: provider.reviewsCount,
          responseTimeMinutes: provider.responseTimeMinutes,
          responseRate,
          completedJobs,
          createdAt: provider.createdAt,
          isVerified: provider.isVerified,
          status: provider.status,
          primaryCategory: provider.primaryCategory
            ? {
                id: provider.primaryCategory.id,
                name: provider.primaryCategory.name,
                slug: provider.primaryCategory.slug,
              }
            : null,
          owner: {
            firstName: provider.user?.firstName || '',
            lastName: provider.user?.lastName || '',
          },
          contact: {
            email: preference?.privacyShowEmail ? provider.user?.email || null : null,
            phoneNumber: preference?.privacyShowPhone
              ? provider.user?.phoneNumber || null
              : null,
            addressLine:
              preference?.privacyShowAddress ? provider.addressLine : null,
            website: null,
            businessHours: null,
          },
          preference: {
            selectedPlan: preference?.selectedPlan || 'basic',
            featuredOnHomepage: preference?.featuredOnHomepage || false,
            profileBadgeText: preference?.profileBadgeText || null,
          },
        },
        services: services.map((service) => ({
          id: service.id,
          name: service.name,
          slug: service.slug,
          description: service.description,
          price: service.price,
          currencyCode: service.currencyCode,
          deliveryMode: service.deliveryMode,
          responseTimeHours: service.responseTimeHours,
          isFeatured: service.isFeatured,
          showPromoBadge: service.showPromoBadge,
          promoBadgeText: service.promoBadgeText,
          category: service.category
            ? {
                id: service.category.id,
                name: service.category.name,
                slug: service.category.slug,
              }
            : null,
        })),
        media: media.map((item) => ({
          id: item.id,
          createdAt: item.createdAt,
          mediaType: item.mediaType,
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl,
          title: item.title,
          description: item.description,
          isFeatured: item.isFeatured,
          showPromoBadge: item.showPromoBadge,
          promoBadgeText: item.promoBadgeText,
          likesCount: item.likesCount,
          commentsCount: item.commentsCount,
          service: item.service
            ? {
                id: item.service.id,
                name: item.service.name,
              }
            : null,
          latestComments: (latestCommentsByMedia[item.id] || []).map((comment) => ({
            id: comment.id,
            authorName: comment.authorName,
            body: comment.body,
            createdAt: comment.createdAt,
          })),
        })),
        stories: visibleStories.map((item) => ({
          id: item.id,
          providerId: item.providerId,
          providerName: provider.companyName,
          providerAvatarUrl: provider.avatarUrl,
          providerLocation: [provider.city, provider.wilaya, provider.region]
            .filter(Boolean)
            .join(', '),
          createdAt: item.createdAt,
          mediaType: item.mediaType,
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl,
          title: item.title,
          description: item.description,
          likesCount: item.likesCount,
          commentsCount: item.commentsCount,
          showPromoBadge: item.showPromoBadge,
          promoBadgeText: item.promoBadgeText,
          storyAudience: item.storyAudience,
          storyExpiresAt: item.storyExpiresAt,
          service: item.service
            ? {
                id: item.service.id,
                name: item.service.name,
              }
            : null,
        })),
      },
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch public provider page',
    });
  }
});

export default router;
