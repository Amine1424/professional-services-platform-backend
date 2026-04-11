import { Request, Response, Router } from 'express';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import { AppDataSource } from '../config/database';
import CustomerPreference, { CustomerPlan } from '../models/CustomerPreference';
import FavoriteProvider from '../models/FavoriteProvider';
import ProviderMedia from '../models/ProviderMedia';
import ServiceProvider from '../models/ServiceProvider';
import User from '../models/User';
import { HashService } from '../services/auth/hashService';

const router = Router();

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const ensureCustomerPreference = async (userId: string) => {
  const repo = AppDataSource.getRepository(CustomerPreference);

  let pref = await repo.findOne({
    where: { userId },
  });

  if (!pref) {
    pref = repo.create({
      userId,
      interests: [],
      selectedPlan: CustomerPlan.FREE,
      preferredRegion: null,
      preferredWilaya: null,
    });

    await repo.save(pref);
  }

  return pref;
};

router.get(
  '/me',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: req.user!.userId },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Customer not found',
        });
        return;
      }

      const preference = await ensureCustomerPreference(user.id);

      res.status(200).json({
        status: 'success',
        message: 'Customer profile fetched successfully',
        data: {
          user,
          preference,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer profile',
      });
    }
  }
);

router.put(
  '/me',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, phoneNumber } = req.body;

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: req.user!.userId },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Customer not found',
        });
        return;
      }

      if (email && String(email).trim().toLowerCase() !== user.email) {
        const existing = await userRepo.findOne({
          where: { email: String(email).trim().toLowerCase() },
        });

        if (existing && existing.id !== user.id) {
          res.status(409).json({
            status: 'error',
            message: 'Email already exists',
          });
          return;
        }

        user.email = String(email).trim().toLowerCase();
      }

      user.firstName =
        firstName !== undefined ? String(firstName).trim() : user.firstName;
      user.lastName =
        lastName !== undefined ? String(lastName).trim() : user.lastName;
      user.phoneNumber =
        phoneNumber !== undefined ? String(phoneNumber).trim() || null : user.phoneNumber;

      await userRepo.save(user);

      res.status(200).json({
        status: 'success',
        message: 'Customer profile updated successfully',
        data: user,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update customer profile',
      });
    }
  }
);

router.get(
  '/me/preferences',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const pref = await ensureCustomerPreference(req.user!.userId);

      res.status(200).json({
        status: 'success',
        message: 'Customer preferences fetched successfully',
        data: pref,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer preferences',
      });
    }
  }
);

router.put(
  '/me/preferences',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const { interests, selectedPlan, preferredRegion, preferredWilaya } = req.body;

      const prefRepo = AppDataSource.getRepository(CustomerPreference);
      const pref = await ensureCustomerPreference(req.user!.userId);

      if (
        selectedPlan &&
        !Object.values(CustomerPlan).includes(selectedPlan as CustomerPlan)
      ) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid customer plan',
        });
        return;
      }

      pref.interests = Array.isArray(interests)
        ? interests.map((item) => String(item).trim()).filter(Boolean)
        : pref.interests;

      pref.selectedPlan = selectedPlan
        ? (selectedPlan as CustomerPlan)
        : pref.selectedPlan;

      pref.preferredRegion =
        preferredRegion !== undefined
          ? String(preferredRegion).trim() || null
          : pref.preferredRegion;

      pref.preferredWilaya =
        preferredWilaya !== undefined
          ? String(preferredWilaya).trim() || null
          : pref.preferredWilaya;

      await prefRepo.save(pref);

      res.status(200).json({
        status: 'success',
        message: 'Customer preferences updated successfully',
        data: pref,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update customer preferences',
      });
    }
  }
);

router.post(
  '/me/change-password',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({
        where: { id: req.user!.userId },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'Customer not found',
        });
        return;
      }

      const isValid = await HashService.comparePassword(
        currentPassword,
        user.passwordHash
      );

      if (!isValid) {
        res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect',
        });
        return;
      }

      if (!passwordRegex.test(String(newPassword || ''))) {
        res.status(400).json({
          status: 'error',
          message:
            'New password must be at least 8 characters and include uppercase, lowercase, number, and special character',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({
          status: 'error',
          message: 'New password and confirm password do not match',
        });
        return;
      }

      user.passwordHash = await HashService.hashPassword(newPassword);
      await userRepo.save(user);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password',
      });
    }
  }
);

router.get(
  '/me/notifications',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const favorites = await AppDataSource.getRepository(FavoriteProvider).find({
        where: { userId: req.user!.userId },
      });

      const providerIds = favorites.map((favorite) => favorite.providerId);

      if (!providerIds.length) {
        res.status(200).json({
          status: 'success',
          message: 'Customer notifications fetched successfully',
          data: [],
        });
        return;
      }

      const providers = await AppDataSource.getRepository(ServiceProvider).find();
      const providerMap = new Map(providers.map((provider) => [provider.id, provider]));

      const media = await AppDataSource.getRepository(ProviderMedia).find({
        where: providerIds.map((providerId) => ({
          providerId,
          isPublished: true,
        })),
        order: { createdAt: 'DESC' },
      });

      const notifications = media.slice(0, 20).map((item) => ({
        id: item.id,
        type: 'new_media',
        title: providerMap.get(item.providerId)?.companyName || 'Provider update',
        body: item.title,
        providerId: item.providerId,
        createdAt: item.createdAt,
      }));

      res.status(200).json({
        status: 'success',
        message: 'Customer notifications fetched successfully',
        data: notifications,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer notifications',
      });
    }
  }
);

export default router;