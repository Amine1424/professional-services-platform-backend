import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import Category from '../models/Category';
import ProviderMedia from '../models/ProviderMedia';
import ProviderPreference from '../models/ProviderPreference';
import Service, { ServiceStatus } from '../models/Service';
import ServiceProvider from '../models/ServiceProvider';

const router = Router();

router.get('/home', async (_req: Request, res: Response) => {
  try {
    const providerRepo = AppDataSource.getRepository(ServiceProvider);
    const prefRepo = AppDataSource.getRepository(ProviderPreference);
    const serviceRepo = AppDataSource.getRepository(Service);
    const mediaRepo = AppDataSource.getRepository(ProviderMedia);

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

    const media = await mediaRepo.find({
      where: { isPublished: true },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });

    const featuredProviders = providers
      .filter((provider) => {
        const pref = preferenceMap.get(provider.id);
        return Boolean(pref?.featuredOnHomepage) || provider.isVerified;
      })
      .slice(0, 8)
      .map((provider) => {
        const pref = preferenceMap.get(provider.id);
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
          profileBadgeText: pref?.profileBadgeText || null,
          primaryCategory: provider.primaryCategory
            ? {
                id: provider.primaryCategory.id,
                name: provider.primaryCategory.name,
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
            }
          : null,
      }));

    const stories = media.slice(0, 12).map((item) => ({
      id: item.id,
      providerId: item.providerId,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      thumbnailUrl: item.thumbnailUrl,
      title: item.title,
      likesCount: item.likesCount,
      commentsCount: item.commentsCount,
      promoBadgeText: item.promoBadgeText,
      showPromoBadge: item.showPromoBadge,
    }));

    res.status(200).json({
      status: 'success',
      message: 'Home discovery feed fetched successfully',
      data: {
        featuredProviders,
        featuredServices,
        stories,
      },
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch discovery home feed',
    });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim().toLowerCase();
    const region = String(req.query.region || '').trim().toLowerCase();
    const wilaya = String(req.query.wilaya || '').trim().toLowerCase();
    const categoryId = String(req.query.categoryId || '').trim();

    const providerRepo = AppDataSource.getRepository(ServiceProvider);
    const prefRepo = AppDataSource.getRepository(ProviderPreference);
    const serviceRepo = AppDataSource.getRepository(Service);

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

    const servicesByProvider = new Map<string, Service[]>();
    services.forEach((service) => {
      if (!servicesByProvider.has(service.providerId)) {
        servicesByProvider.set(service.providerId, []);
      }
      servicesByProvider.get(service.providerId)!.push(service);
    });

    const filtered = providers.filter((provider) => {
      const providerServices = servicesByProvider.get(provider.id) || [];

      if (providerServices.length === 0) return false;

      const matchesRegion = region
        ? `${provider.region || ''}`.toLowerCase().includes(region)
        : true;

      const matchesWilaya = wilaya
        ? `${provider.wilaya || ''}`.toLowerCase().includes(wilaya)
        : true;

      const matchesCategory = categoryId
        ? provider.primaryCategoryId === categoryId ||
          providerServices.some((service) => service.categoryId === categoryId)
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

      return matchesRegion && matchesWilaya && matchesCategory && matchesQuery;
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
          profileBadgeText: pref?.profileBadgeText || null,
          featuredOnHomepage: pref?.featuredOnHomepage || false,
          primaryCategory: provider.primaryCategory
            ? {
                id: provider.primaryCategory.id,
                name: provider.primaryCategory.name,
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
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch search results',
    });
  }
});

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await AppDataSource.getRepository(Category).find({
      order: { createdAt: 'DESC' },
    });

    res.status(200).json({
      status: 'success',
      message: 'Discovery categories fetched successfully',
      data: categories,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch discovery categories',
    });
  }
});

export default router;