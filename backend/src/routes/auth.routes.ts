import { Request, Response, Router } from 'express';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { ServiceProvider, ProviderStatus } from '../models/ServiceProvider';
import { User, UserRole } from '../models/User';
import { HashService } from '../services/auth/hashService';
import { JwtService } from '../services/auth/jwtService';
import { logger } from '../utils/logger';
import {
  handleValidationErrors,
  validateLogin,
  validateRegister,
} from '../utils/validators';

const router = Router();

router.post(
  '/register',
  validateRegister(),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        companyName,
      } = req.body;

      const normalizedEmail = String(email).toLowerCase().trim();

      const existingUser = await AppDataSource.getRepository(User).findOne({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        res.status(409).json({
          status: 'error',
          message: 'Email already exists',
        });
        return;
      }

      const passwordHash = await HashService.hashPassword(password);

      const result = await AppDataSource.transaction(
        async (manager: EntityManager) => {
          const userRepository = manager.getRepository(User);
          const providerRepository = manager.getRepository(ServiceProvider);

          const user = userRepository.create({
            email: normalizedEmail,
            passwordHash,
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            phoneNumber: phone?.trim() || null,
            role:
              role === UserRole.SERVICE_PROVIDER
                ? UserRole.SERVICE_PROVIDER
                : UserRole.CUSTOMER,
          });

          await userRepository.save(user);

          if (user.role === UserRole.SERVICE_PROVIDER) {
            const provider = providerRepository.create({
              userId: user.id,
              companyName:
                companyName?.trim() || `${user.firstName} ${user.lastName}`,
              description: null,
              region: null,
              wilaya: null,
              city: null,
              addressLine: null,
              avatarUrl: null,
              coverUrl: null,
              primaryCategoryId: null,
              yearsOfExperience: 0,
              averageRating: '0',
              reviewsCount: 0,
              responseTimeMinutes: 0,
              isVerified: false,
              status: ProviderStatus.PENDING,
            });

            await providerRepository.save(provider);
          }

          return user;
        }
      );

      const tokens = JwtService.generateTokens({
        userId: result.id,
        email: result.email,
        role: result.role,
      });

      res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
          user: {
            id: result.id,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            role: result.role,
            phoneNumber: result.phoneNumber,
          },
          ...tokens,
        },
      });
    } catch (error: any) {
      logger.error('Register failed', {
        message: error?.message,
        stack: error?.stack,
        detail: error?.detail,
        code: error?.code,
        constraint: error?.constraint,
      });

      res.status(500).json({
        status: 'error',
        message:
          process.env.NODE_ENV === 'development'
            ? error?.message || 'Failed to register user'
            : 'Failed to register user',
      });
    }
  }
);

router.post(
  '/login',
  validateLogin(),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { email: String(email).toLowerCase().trim() },
      });

      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
        });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({
          status: 'error',
          message: 'This account is inactive',
        });
        return;
      }

      const isPasswordValid = await HashService.comparePassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password',
        });
        return;
      }

      const tokens = JwtService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneNumber: user.phoneNumber,
          },
          ...tokens,
        },
      });
    } catch (error: any) {
      logger.error('Login failed', {
        message: error?.message,
        stack: error?.stack,
      });

      res.status(500).json({
        status: 'error',
        message:
          process.env.NODE_ENV === 'development'
            ? error?.message || 'Failed to login'
            : 'Failed to login',
      });
    }
  }
);

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: req.user?.userId },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Current user fetched successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phoneNumber: user.phoneNumber,
        },
      },
    });
  } catch (error: any) {
    logger.error('Fetch current user failed', {
      message: error?.message,
      stack: error?.stack,
    });

    res.status(500).json({
      status: 'error',
      message:
        process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to fetch current user'
          : 'Failed to fetch current user',
    });
  }
});

router.post('/logout', authMiddleware, async (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logout successful',
  });
});

router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
      return;
    }

    const payload = JwtService.verifyRefreshToken(refreshToken);

    if (!payload) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);

    const user = await userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        status: 'error',
        message: 'User no longer valid',
      });
      return;
    }

    const tokens = JwtService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error: any) {
    logger.error('Refresh token failed', {
      message: error?.message,
      stack: error?.stack,
    });

    res.status(500).json({
      status: 'error',
      message:
        process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to refresh token'
          : 'Failed to refresh token',
    });
  }
});

export default router;