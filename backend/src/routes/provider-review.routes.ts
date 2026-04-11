import { Request, Response, Router } from 'express';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import ProviderReview from '../models/ProviderReview';
import ServiceProvider from '../models/ServiceProvider';
import User from '../models/User';

const router = Router();

const refreshProviderRating = async (providerId: string) => {
  const reviewRepo = AppDataSource.getRepository(ProviderReview);
  const providerRepo = AppDataSource.getRepository(ServiceProvider);

  const reviews = await reviewRepo.find({
    where: { providerId },
  });

  const count = reviews.length;
  const average =
    count > 0
      ? (
          reviews.reduce((sum, review) => sum + Number(review.rating), 0) / count
        ).toFixed(2)
      : '0.00';

  await providerRepo.update(providerId, {
    averageRating: average,
    reviewsCount: count,
  });
};

router.get('/provider/:providerId', async (req: Request, res: Response) => {
  try {
    const providerId = String(req.params.providerId);

    const reviews = await AppDataSource.getRepository(ProviderReview).find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });

    const users = await AppDataSource.getRepository(User).find();
    const userMap = new Map(users.map((user) => [user.id, user]));

    res.status(200).json({
      status: 'success',
      message: 'Provider reviews fetched successfully',
      data: reviews.map((review) => ({
        id: review.id,
        providerId: review.providerId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName: userMap.get(review.userId)
          ? `${userMap.get(review.userId)!.firstName} ${userMap.get(review.userId)!.lastName}`
          : 'Client',
      })),
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch provider reviews',
    });
  }
});

router.get(
  '/me',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const reviews = await AppDataSource.getRepository(ProviderReview).find({
        where: { userId: req.user!.userId },
        order: { createdAt: 'DESC' },
      });

      const providers = await AppDataSource.getRepository(ServiceProvider).find();
      const providerMap = new Map(providers.map((provider) => [provider.id, provider]));

      res.status(200).json({
        status: 'success',
        message: 'Customer reviews fetched successfully',
        data: reviews.map((review) => ({
          ...review,
          provider: providerMap.get(review.providerId)
            ? {
                id: providerMap.get(review.providerId)!.id,
                companyName: providerMap.get(review.providerId)!.companyName,
                avatarUrl: providerMap.get(review.providerId)!.avatarUrl,
              }
            : null,
        })),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer reviews',
      });
    }
  }
);

router.post(
  '/provider/:providerId',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const providerId = String(req.params.providerId);
      const { rating, comment } = req.body;

      const numericRating = Number(rating);

      if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        res.status(400).json({
          status: 'error',
          message: 'Rating must be between 1 and 5',
        });
        return;
      }

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

      const reviewRepo = AppDataSource.getRepository(ProviderReview);

      let review = await reviewRepo.findOne({
        where: {
          userId: req.user!.userId,
          providerId,
        },
      });

      if (!review) {
        review = reviewRepo.create({
          userId: req.user!.userId,
          providerId,
          rating: numericRating,
          comment: String(comment || '').trim() || null,
        });
      } else {
        review.rating = numericRating;
        review.comment = String(comment || '').trim() || null;
      }

      await reviewRepo.save(review);
      await refreshProviderRating(providerId);

      res.status(200).json({
        status: 'success',
        message: 'Provider review saved successfully',
        data: review,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to save provider review',
      });
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const reviewId = String(req.params.id);
      const reviewRepo = AppDataSource.getRepository(ProviderReview);

      const review = await reviewRepo.findOne({
        where: { id: reviewId, userId: req.user!.userId },
      });

      if (!review) {
        res.status(404).json({
          status: 'error',
          message: 'Review not found',
        });
        return;
      }

      const providerId = review.providerId;
      await reviewRepo.remove(review);
      await refreshProviderRating(providerId);

      res.status(200).json({
        status: 'success',
        message: 'Review deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete review',
      });
    }
  }
);

export default router;