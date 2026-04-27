import { Request, Response, Router } from 'express';
import { In, MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import Category from '../models/Category';
import FavoriteProvider from '../models/FavoriteProvider';
import ProviderMedia, { ProviderMediaStoryAudience } from '../models/ProviderMedia';
import ProviderPreference from '../models/ProviderPreference';
import Service, { ServiceStatus } from '../models/Service';
import ServiceProvider from '../models/ServiceProvider';
import ProviderReview from '../models/ProviderReview';
import { buildProviderCoverageSummary, providerMatchesGeoFilters } from '../utils/algeria';
import { buildCategoryTree, collectCategoryBranchIds } from '../utils/categoryTree';

const router = Router();

const mapStoryItem = (item: ProviderMedia) => ({
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

const buildHomeBase = async () => {
  const providerRepo = AppDataSource.getRepository(ServiceProvider);
  const prefRepo = AppDataSource.getRepository(ProviderPreference);
  const serviceRepo = AppDataSource.getRepository(Service);
  const reviewRepo = AppDataSource.getRepository(ProviderReview);

  const providers = await providerRepo.find({
    relations: ['primaryCategory', 'user'],
    order: { createdAt: 'DESC' },
  });

  const preferences = await prefRepo.find();
  const preferenceMap = new Map(preferences.map((p) => [p.providerId, p]));

  const services = await serviceRepo.find({
    where: { status: ServiceStatus.PUBLISHED },
    relations: ['category', 'provider'],
    order: { createdAt: 'DESC' },
  });

  const reviews = await reviewRepo.find({
    order: { createdAt: 'DESC' },
    take: 8,
  });

  const servicesByProvider = new Map<string, Service[]>();
  services.forEach((service) => {
    if (!servicesByProvider.has(service.providerId)) {
      servicesByProvider.set(service.providerId, []);
    }

    servicesByProvider.get(service.providerId)!.push(service);
  });

  const featuredProviders = providers
    .filter((provider) => {
      const pref = preferenceMap.get(provider.id);
      return Boolean(pref?.featuredOnHomepage) || provider.isVerified;
    })
    .slice(0, 8)
    .map((provider) => {
      const pref = preferenceMap.get(provider.id);
      const providerServices = servicesByProvider.get(provider.id) || [];
      const startingPrice = providerServices
        .map((service) => Number(service.price))
        .filter((price) => Number.isFinite(price) && price > 0)
        .sort((left, right) => left - right)[0];
      const serviceHeadline = providerServices[0]?.name
        ? `${providerServices[0].name}${provider.primaryCategory?.name ? ` - ${provider.primaryCategory.name}` : ''}`.trim()
        : null;
      const providerDescription = provider.description?.trim();

      return {
        id: provider.id,
        companyName: provider.companyName,
        avatarUrl: provider.avatarUrl,
        coverUrl: provider.coverUrl,
        headline:
          providerDescription ||
          serviceHeadline ||
          provider.primaryCategory?.name ||
          'Professional services',
        city: provider.city,
        wilaya: provider.wilaya,
        region: provider.region,
        averageRating: provider.averageRating,
        reviewsCount: provider.reviewsCount,
        yearsOfExperience: provider.yearsOfExperience,
        responseTimeMinutes:
          provider.responseTimeMinutes ||
          providerServices
            .map((service) => service.responseTimeHours * 60)
            .filter((value) => Number.isFinite(value) && value > 0)
            .sort((left, right) => left - right)[0] ||
          null,
        startingPrice: Number.isFinite(startingPrice) ? startingPrice : null,
        isVerified: provider.isVerified,
        profileBadgeText: pref?.profileBadgeText || null,
        primaryCategory: provider.primaryCategory
          ? {
              id: provider.primaryCategory.id,
              name: provider.primaryCategory.name,
              slug: provider.primaryCategory.slug,
            }
          : null,
      };
    });

  const featuredServices = services
    .filter((service) => service.isFeatured)
    .slice(0, 10)
    .map((service) => ({
      id: service.id,
      providerId: service.providerId,
      name: service.name,
      description: service.description,
      price: service.price,
      currencyCode: service.currencyCode,
      showPromoBadge: service.showPromoBadge,
      promoBadgeText: service.promoBadgeText,
      category: service.category
        ? {
            id: service.category.id,
            name: service.category.name,
            slug: service.category.slug,
          }
        : null,
    }));

  const recentReviews = reviews
    .map((review) => {
      const provider = providers.find((entry) => entry.id === review.providerId);

      return {
        id: review.id,
        providerId: review.providerId,
        providerName: provider?.companyName || 'Provider',
        providerAvatarUrl: provider?.avatarUrl || provider?.coverUrl || null,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      };
    })
    .filter((item) => Boolean(item.comment))
    .slice(0, 6);

  return {
    featuredProviders,
    featuredServices,
    recentReviews,
  };
};

const getPublicStories = async () => {
  const mediaRepo = AppDataSource.getRepository(ProviderMedia);

  return await mediaRepo.find({
    where: {
      isPublished: true,
      isStory: true,
      storyAudience: ProviderMediaStoryAudience.PUBLIC,
      storyExpiresAt: MoreThan(new Date()),
    },
    relations: ['service', 'provider'],
    order: { createdAt: 'DESC' },
    take: 12,
  });
};

const getCustomerStories = async (favoriteProviderIds: string[]) => {
  const mediaRepo = AppDataSource.getRepository(ProviderMedia);

  const publicStories = await mediaRepo.find({
    where: {
      isPublished: true,
      isStory: true,
      storyAudience: ProviderMediaStoryAudience.PUBLIC,
      storyExpiresAt: MoreThan(new Date()),
    },
    relations: ['service', 'provider'],
    order: { createdAt: 'DESC' },
    take: 24,
  });

  if (!favoriteProviderIds.length) {
    return publicStories.slice(0, 12);
  }

  const favoriteStories = await mediaRepo.find({
    where: {
      isPublished: true,
      isStory: true,
      storyAudience: ProviderMediaStoryAudience.FAVORITES_ONLY,
      providerId: In(favoriteProviderIds),
      storyExpiresAt: MoreThan(new Date()),
    },
    relations: ['service', 'provider'],
    order: { createdAt: 'DESC' },
    take: 24,
  });

  return [...publicStories, ...favoriteStories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter(
      (item, index, array) => array.findIndex((entry) => entry.id === item.id) === index
    )
    .slice(0, 12);
};

router.get('/home', async (_req: Request, res: Response) => {
  try {
    const base = await buildHomeBase();
    const stories = await getPublicStories();

    res.status(200).json({
      status: 'success',
      message: 'Home discovery feed fetched successfully',
      data: {
        ...base,
        stories: stories.map(mapStoryItem),
      },
    });
  } catch (error) {
    console.error('Failed to fetch discovery home feed', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch discovery home feed',
    });
  }
});

router.get(
  '/customer-home',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const favoriteProviderIds = (
        await AppDataSource.getRepository(FavoriteProvider).find({
          where: { userId: req.user!.userId },
        })
      ).map((item) => item.providerId);

      const base = await buildHomeBase();
      const stories = await getCustomerStories(favoriteProviderIds);

      res.status(200).json({
        status: 'success',
        message: 'Customer home feed fetched successfully',
        data: {
          ...base,
          stories: stories.map(mapStoryItem),
        },
      });
    } catch (error) {
      console.error('Failed to fetch customer home feed', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer home feed',
      });
    }
  }
);

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim().toLowerCase();
    const location = String(req.query.location || '').trim().toLowerCase();
    const region = String(req.query.region || '').trim().toLowerCase();
    const wilaya = String(req.query.wilaya || '').trim().toLowerCase();
    const categoryId = String(req.query.categoryId || '').trim();

    const providerRepo = AppDataSource.getRepository(ServiceProvider);
    const prefRepo = AppDataSource.getRepository(ProviderPreference);
    const serviceRepo = AppDataSource.getRepository(Service);
    const categoryRepo = AppDataSource.getRepository(Category);

    const providers = await providerRepo.find({
      relations: ['primaryCategory', 'user'],
      order: { createdAt: 'DESC' },
    });

    const preferences = await prefRepo.find();
    const preferenceMap = new Map(preferences.map((p) => [p.providerId, p]));

    const services = await serviceRepo.find({
      where: { status: ServiceStatus.PUBLISHED },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });

    const categories = categoryId
      ? await categoryRepo.find({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            iconUrl: true,
            parentId: true,
          },
        })
      : [];

    const allowedCategoryIds = categoryId
      ? new Set(collectCategoryBranchIds(categories, categoryId))
      : null;

    const servicesByProvider = new Map<string, Service[]>();
    services.forEach((service) => {
      if (!servicesByProvider.has(service.providerId)) {
        servicesByProvider.set(service.providerId, []);
      }
      servicesByProvider.get(service.providerId)!.push(service);
    });

    const filtered = providers.filter((provider) => {
      const providerServices = servicesByProvider.get(provider.id) || [];

      if (providerServices.length === 0) {
        return false;
      }

      const matchesGeo = providerMatchesGeoFilters(provider, {
        location,
        region,
        wilaya,
      });

      const matchesCategory = allowedCategoryIds
        ? (provider.primaryCategoryId
            ? allowedCategoryIds.has(provider.primaryCategoryId)
            : false) ||
          providerServices.some(
            (service) => service.categoryId && allowedCategoryIds.has(service.categoryId)
          )
        : true;

      const searchable = [
        provider.companyName,
        provider.description || '',
        provider.city || '',
        provider.wilaya || '',
        provider.region || '',
        provider.primaryCategory?.name || '',
        ...providerServices.map((service) => service.name),
        ...providerServices.map((service) => service.description),
        ...providerServices.map((service) => service.category?.name || ''),
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = query ? searchable.includes(query) : true;

      return matchesGeo && matchesCategory && matchesQuery;
    });

    res.status(200).json({
      status: 'success',
      message: 'Discovery search fetched successfully',
      data: filtered.map((provider) => {
        const pref = preferenceMap.get(provider.id);
        const providerServices = servicesByProvider.get(provider.id) || [];

        return {
          id: provider.id,
          companyName: provider.companyName,
          avatarUrl: provider.avatarUrl,
          coverUrl: provider.coverUrl,
          city: provider.city,
          wilaya: provider.wilaya,
          region: provider.region,
          averageRating: provider.averageRating,
          reviewsCount: provider.reviewsCount,
          isVerified: provider.isVerified,
          yearsOfExperience: provider.yearsOfExperience,
          responseTimeMinutes: provider.responseTimeMinutes,
          serviceCoverage: buildProviderCoverageSummary(provider),
          profileBadgeText: pref?.profileBadgeText || null,
          featuredOnHomepage: pref?.featuredOnHomepage || false,
          primaryCategory: provider.primaryCategory
            ? {
                id: provider.primaryCategory.id,
                name: provider.primaryCategory.name,
                slug: provider.primaryCategory.slug,
              }
            : null,
          servicesPreview: providerServices.slice(0, 3).map((service) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            currencyCode: service.currencyCode,
            promoBadgeText: service.promoBadgeText,
            showPromoBadge: service.showPromoBadge,
          })),
        };
      }),
    });
  } catch (error) {
    console.error('Failed to fetch search results', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch search results',
    });
  }
});

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categoryRepo = AppDataSource.getRepository(Category);
    const serviceRepo = AppDataSource.getRepository(Service);
    const providerRepo = AppDataSource.getRepository(ServiceProvider);

    const categories = await categoryRepo.find({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconUrl: true,
        parentId: true,
      },
    });

    const [services, providers] = await Promise.all([
      serviceRepo.find({
        where: { status: ServiceStatus.PUBLISHED },
        select: {
          providerId: true,
          categoryId: true,
        },
      }),
      providerRepo.find({
        select: {
          id: true,
          primaryCategoryId: true,
        },
      }),
    ]);

    const providerCountsByCategory = new Map<string, number>();

    categories.forEach((category) => {
      const branchIds = new Set(collectCategoryBranchIds(categories, category.id));
      const providerIds = new Set<string>();

      providers.forEach((provider) => {
        if (provider.primaryCategoryId && branchIds.has(provider.primaryCategoryId)) {
          providerIds.add(provider.id);
        }
      });

      services.forEach((service) => {
        if (service.categoryId && branchIds.has(service.categoryId)) {
          providerIds.add(service.providerId);
        }
      });

      providerCountsByCategory.set(category.id, providerIds.size);
    });

    res.status(200).json({
      status: 'success',
      message: 'Discovery categories fetched successfully',
      data: buildCategoryTree(
        categories.map((category) => ({
          ...category,
          providerCount: providerCountsByCategory.get(category.id) || 0,
        }))
      ),
    });
  } catch (error) {
    console.error('Failed to fetch discovery categories', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch discovery categories',
    });
  }
});

export default router;
