import { Request, Response, Router } from 'express';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import FavoriteProvider from '../models/FavoriteProvider';
import ProviderPreference from '../models/ProviderPreference';
import ServiceProvider from '../models/ServiceProvider';

const router = Router();

router.get(
  '/providers',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const favoriteRepo = AppDataSource.getRepository(FavoriteProvider);
      const providerRepo = AppDataSource.getRepository(ServiceProvider);
      const prefRepo = AppDataSource.getRepository(ProviderPreference);

      const favorites = await favoriteRepo.find({
        where: { userId: req.user!.userId },
        order: { createdAt: 'DESC' },
      });

      const providerIds = favorites.map((item) => item.providerId);

      if (!providerIds.length) {
        res.status(200).json({
          status: 'success',
          message: 'Favorite providers fetched successfully',
          data: [],
        });
        return;
      }

      const providersWithRelations = await providerRepo.find({
        relations: ['primaryCategory'],
      });
      const prefs = await prefRepo.find();

      const providerMap = new Map(
        providersWithRelations.map((provider) => [provider.id, provider])
      );
      const prefMap = new Map(prefs.map((pref) => [pref.providerId, pref]));

      const favoriteMap = new Map(favorites.map((favorite) => [favorite.providerId, favorite]));

      const result = providerIds
        .map((providerId) => {
          const provider = providerMap.get(providerId);
          if (!provider) return null;

          const pref = prefMap.get(provider.id);
          const favorite = favoriteMap.get(provider.id);

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
            responseTimeMinutes: provider.responseTimeMinutes,
            primaryCategoryName: provider.primaryCategory?.name || null,
            profileBadgeText: pref?.profileBadgeText || null,
            savedAt: favorite?.createdAt || null,
          };
        })
        .filter(Boolean);

      res.status(200).json({
        status: 'success',
        message: 'Favorite providers fetched successfully',
        data: result,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch favorite providers',
      });
    }
  }
);

router.post(
  '/providers/:providerId',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.providerId);

      const provider = await AppDataSource.getRepository(ServiceProvider).findOne({
        where: { id: providerId },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider not found',
        });
        return;
      }

      const favoriteRepo = AppDataSource.getRepository(FavoriteProvider);

      const existing = await favoriteRepo.findOne({
        where: {
          userId: req.user!.userId,
          providerId,
        },
      });

      if (!existing) {
        const favorite = favoriteRepo.create({
          userId: req.user!.userId,
          providerId,
        });

        await favoriteRepo.save(favorite);
      }

      res.status(200).json({
        status: 'success',
        message: 'Provider added to favorites successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add provider to favorites',
      });
    }
  }
);

router.delete(
  '/providers/:providerId',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.providerId);
      const favoriteRepo = AppDataSource.getRepository(FavoriteProvider);

      const favorite = await favoriteRepo.findOne({
        where: {
          userId: req.user!.userId,
          providerId,
        },
      });

      if (favorite) {
        await favoriteRepo.remove(favorite);
      }

      res.status(200).json({
        status: 'success',
        message: 'Provider removed from favorites successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to remove provider from favorites',
      });
    }
  }
);

export default router;
