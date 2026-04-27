import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import Category from '../models/Category';
import ProviderMedia from '../models/ProviderMedia';
import {
  ProviderCoverageMode,
  ProviderStatus,
  ServiceProvider,
} from '../models/ServiceProvider';
import { ProviderPlan, ProviderPreference } from '../models/ProviderPreference';
import { Service, ServiceStatus } from '../models/Service';
import { User } from '../models/User';
import { HashService } from '../services/auth/hashService';
import {
  cleanupLocalUploadedFile,
  createUploadMiddleware,
  getUploadErrorMessage,
  resolveUploadedFileUrl,
  UPLOAD_FOLDERS,
} from '../services/upload.service';
import { buildProviderCoverageSummary } from '../utils/algeria';
import { imageOnlyFilter, removeLocalUploadByUrl } from '../utils/uploads';

const router = Router();
const providerProfileUpload = createUploadMiddleware(
  (req) => ['providers', req.user?.userId || 'anonymous', 'profile'],
  imageOnlyFilter
);
const cleanupProviderProfileUploads = (req: Request) => {
  const files = req.files as
    | {
        avatarFile?: Express.Multer.File[];
        coverFile?: Express.Multer.File[];
      }
    | undefined;

  const avatarFile = files?.avatarFile?.[0];
  const coverFile = files?.coverFile?.[0];

  if (avatarFile) {
    cleanupLocalUploadedFile(avatarFile);
  }

  if (coverFile) {
    cleanupLocalUploadedFile(coverFile);
  }
};

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const getPlanFeatures = (plan: ProviderPlan) => {
  return {
    canUseProfileBadge: plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS,
    canUseServicePromoBadge: plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS,
    canFeatureOnHomepage: plan === ProviderPlan.BUSINESS,
    canFeatureServices: plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS,
  };
};

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

const buildReplyFromContext = (
  provider: ServiceProvider,
  services: Service[],
  customerMessage: string,
  preference: ProviderPreference
) => {
  const normalizedMessage = customerMessage.toLowerCase();

  const publishedServices = services.filter(
    (service) => service.status === ServiceStatus.PUBLISHED
  );

  const sourceServices = publishedServices.length ? publishedServices : services;

  const scored = sourceServices.map((service) => {
    const haystack = `${service.name} ${service.description} ${service.category?.name || ''}`.toLowerCase();
    let score = 0;

    const tokens = normalizedMessage.split(/\s+/).filter(Boolean);
    tokens.forEach((token) => {
      if (token.length > 2 && haystack.includes(token)) {
        score += 1;
      }
    });

    return { service, score };
  });

  const matchedServices = scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.service)
    .slice(0, 3);

  const toneIntro =
    preference.autoReplyTone === 'friendly'
      ? `مرحبًا 👋، معك ${provider.companyName}. شكرًا على رسالتك.`
      : preference.autoReplyTone === 'concise'
      ? `مرحبًا، شكرًا لتواصلك مع ${provider.companyName}.`
      : `مرحبًا، نشكرك على التواصل مع ${provider.companyName}.`;

  const serviceLines =
    matchedServices.length > 0
      ? matchedServices
          .map((service) => {
            const priceText = service.price
              ? ` — السعر: ${service.price} ${service.currencyCode}`
              : '';
            const badgeText =
              service.showPromoBadge && service.promoBadgeText
                ? ` — العرض: ${service.promoBadgeText}`
                : '';

            return `• ${service.name}${priceText}${badgeText}`;
          })
          .join('\n')
      : '• يمكننا مساعدتك بعد توضيح نوع الخدمة المطلوبة أكثر.';

  const responseTimeText =
    provider.responseTimeMinutes > 0
      ? `عادةً نرد خلال حوالي ${provider.responseTimeMinutes} دقيقة.`
      : 'سنرد عليك في أقرب وقت ممكن.';

  const closing =
    'إذا رغبت، أرسل لنا تفاصيل أكثر مثل المدينة، نوع الخدمة، والميزانية المتوقعة حتى نوجهك بشكل أدق.';

  const signature = preference.autoReplySignature
    ? `\n\n${preference.autoReplySignature}`
    : '';

  const reply = `${toneIntro}

الخدمات الأقرب لطلبك:
${serviceLines}

${responseTimeText}
${closing}${signature}`;

  return {
    matchedServices,
    reply,
  };
};

router.get('/', async (_req: Request, res: Response) => {
  try {
    const providerRepository = AppDataSource.getRepository(ServiceProvider);

    const providers = await providerRepository.find({
      relations: ['user', 'primaryCategory', 'services', 'preference'],
      order: { createdAt: 'DESC' },
    });

    res.status(200).json({
      status: 'success',
      message: 'Providers fetched successfully',
      data: providers,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch providers',
    });
  }
});

router.get(
  '/me',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
        relations: ['user', 'primaryCategory', 'services', 'preference'],
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      res.status(200).json({
        status: 'success',
        message: 'Provider profile fetched successfully',
        data: {
          ...provider,
          preference,
          planFeatures: getPlanFeatures(preference.selectedPlan),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider profile',
      });
    }
  }
);

router.get(
  '/me/dashboard',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);
      const serviceRepository = AppDataSource.getRepository(Service);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
        relations: ['user', 'primaryCategory', 'preference'],
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      const services = await serviceRepository.find({
        where: { providerId: provider.id },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });

      const publishedServices = services.filter(
        (service) => service.status === ServiceStatus.PUBLISHED
      ).length;

      const draftServices = services.filter(
        (service) => service.status === ServiceStatus.DRAFT
      ).length;

      const pausedServices = services.filter(
        (service) => service.status === ServiceStatus.PAUSED
      ).length;

      const featuredServices = services.filter((service) => service.isFeatured).length;

      const completionChecks = [
        !!provider.companyName,
        !!provider.description,
        !!provider.region,
        !!provider.wilaya,
        !!provider.city,
        !!provider.serviceCoverageMode,
        !!provider.addressLine,
        !!provider.primaryCategoryId,
        provider.yearsOfExperience > 0,
        !!provider.avatarUrl,
        !!provider.coverUrl,
        services.length > 0,
      ];

      const completionPercentage = Math.round(
        (completionChecks.filter(Boolean).length / completionChecks.length) * 100
      );

      res.status(200).json({
        status: 'success',
        message: 'Provider dashboard fetched successfully',
        data: {
          provider,
          preference,
          coverage: buildProviderCoverageSummary(provider),
          planFeatures: getPlanFeatures(preference.selectedPlan),
          stats: {
            totalServices: services.length,
            publishedServices,
            draftServices,
            pausedServices,
            featuredServices,
            reviewsCount: provider.reviewsCount,
            averageRating: provider.averageRating,
            responseTimeMinutes: provider.responseTimeMinutes,
            completionPercentage,
            isVerified: provider.isVerified,
            status: provider.status,
          },
          recentServices: services.slice(0, 5),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider dashboard',
      });
    }
  }
);

router.get(
  '/me/services',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);
      const serviceRepository = AppDataSource.getRepository(Service);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const services = await serviceRepository.find({
        where: { providerId: provider.id },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider services fetched successfully',
        data: services,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider services',
      });
    }
  }
);

router.post(
  '/me/media',
  authMiddleware,
  authorizeRole('service_provider'),
  providerProfileUpload.fields([
    { name: 'avatarFile', maxCount: 1 },
    { name: 'coverFile', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);
      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
      });

      if (!provider) {
        cleanupProviderProfileUploads(req);
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const files = req.files as
        | {
            avatarFile?: Express.Multer.File[];
            coverFile?: Express.Multer.File[];
          }
        | undefined;
      const avatarFile = files?.avatarFile?.[0];
      const coverFile = files?.coverFile?.[0];

      if (!avatarFile && !coverFile) {
        cleanupProviderProfileUploads(req);
        res.status(400).json({
          status: 'error',
          message: 'Select at least one image to upload',
        });
        return;
      }

      const previousAvatarUrl = provider.avatarUrl;
      const previousCoverUrl = provider.coverUrl;

      if (avatarFile) {
        const avatarUpload = await resolveUploadedFileUrl(avatarFile, {
          folder: UPLOAD_FOLDERS.providers,
          resourceType: 'image',
        });
        provider.avatarUrl = avatarUpload.secureUrl;
      }

      if (coverFile) {
        const coverUpload = await resolveUploadedFileUrl(coverFile, {
          folder: UPLOAD_FOLDERS.providers,
          resourceType: 'image',
        });
        provider.coverUrl = coverUpload.secureUrl;
      }

      await providerRepository.save(provider);

      if (avatarFile && previousAvatarUrl && previousAvatarUrl !== provider.avatarUrl) {
        removeLocalUploadByUrl(previousAvatarUrl);
      }

      if (coverFile && previousCoverUrl && previousCoverUrl !== provider.coverUrl) {
        removeLocalUploadByUrl(previousCoverUrl);
      }

      res.status(200).json({
        status: 'success',
        message: 'Provider media uploaded successfully',
        data: {
          avatarUrl: provider.avatarUrl,
          coverUrl: provider.coverUrl,
        },
      });
    } catch (error) {
      cleanupProviderProfileUploads(req);
      res.status(500).json({
        status: 'error',
        message: getUploadErrorMessage(error, 'Failed to upload provider media'),
      });
    }
  }
);

router.put(
  '/me',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const {
        companyName,
        description,
        region,
        wilaya,
        city,
        addressLine,
        primaryCategoryId,
        yearsOfExperience,
        responseTimeMinutes,
        avatarUrl,
        coverUrl,
        serviceCoverageMode,
        serviceCoverageRegions,
      } = req.body;

      provider.companyName =
        companyName !== undefined ? String(companyName).trim() : provider.companyName;

      provider.description =
        description !== undefined ? String(description).trim() || null : provider.description;

      provider.region = region !== undefined ? String(region).trim() || null : provider.region;
      provider.wilaya = wilaya !== undefined ? String(wilaya).trim() || null : provider.wilaya;
      provider.city = city !== undefined ? String(city).trim() || null : provider.city;
      provider.addressLine =
        addressLine !== undefined ? String(addressLine).trim() || null : provider.addressLine;

      provider.primaryCategoryId =
        primaryCategoryId !== undefined ? primaryCategoryId || null : provider.primaryCategoryId;

      provider.yearsOfExperience =
        yearsOfExperience !== undefined
          ? Number(yearsOfExperience) || 0
          : provider.yearsOfExperience;

      provider.responseTimeMinutes =
        responseTimeMinutes !== undefined
          ? Number(responseTimeMinutes) || 0
          : provider.responseTimeMinutes;

      provider.serviceCoverageMode =
        serviceCoverageMode !== undefined &&
        Object.values(ProviderCoverageMode).includes(serviceCoverageMode as ProviderCoverageMode)
          ? (serviceCoverageMode as ProviderCoverageMode)
          : provider.serviceCoverageMode;

      provider.serviceCoverageRegions =
        serviceCoverageRegions !== undefined
          ? Array.isArray(serviceCoverageRegions)
            ? serviceCoverageRegions
                .map((item: unknown) => String(item).trim())
                .filter(Boolean)
            : null
          : provider.serviceCoverageRegions;

      if (provider.serviceCoverageMode !== ProviderCoverageMode.REGIONAL) {
        provider.serviceCoverageRegions = null;
      }

      provider.avatarUrl =
        avatarUrl !== undefined ? String(avatarUrl).trim() || null : provider.avatarUrl;

      provider.coverUrl =
        coverUrl !== undefined ? String(coverUrl).trim() || null : provider.coverUrl;

      await providerRepository.save(provider);

      const updatedProvider = await providerRepository.findOne({
        where: { id: provider.id },
        relations: ['user', 'primaryCategory', 'services', 'preference'],
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider profile updated successfully',
        data: updatedProvider,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update provider profile',
      });
    }
  }
);

router.put(
  '/me/account',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, phoneNumber } = req.body;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: req.user!.userId },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
        return;
      }

      if (email && String(email).trim().toLowerCase() !== user.email) {
        const existingUser = await userRepository.findOne({
          where: { email: String(email).trim().toLowerCase() },
        });

        if (existingUser && existingUser.id !== user.id) {
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

      await userRepository.save(user);

      res.status(200).json({
        status: 'success',
        message: 'Account information updated successfully',
        data: user,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update account information',
      });
    }
  }
);

router.post(
  '/me/change-password',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const userRepository = AppDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: req.user!.userId },
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found',
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
      await userRepository.save(user);

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
  '/me/preferences',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      res.status(200).json({
        status: 'success',
        message: 'Provider preferences fetched successfully',
        data: {
          preference,
          planFeatures: getPlanFeatures(preference.selectedPlan),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider preferences',
      });
    }
  }
);

router.put(
  '/me/preferences',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const providerRepository = AppDataSource.getRepository(ServiceProvider);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      const {
        selectedPlan,
        featuredOnHomepage,
        profileBadgeText,
        autoReplyEnabled,
        autoReplyTone,
        autoReplySignature,
        privacyShowEmail,
        privacyShowPhone,
        privacyShowAddress,
      } = req.body;

      if (
        selectedPlan &&
        !Object.values(ProviderPlan).includes(selectedPlan as ProviderPlan)
      ) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid selected plan',
        });
        return;
      }

      if (selectedPlan) {
        preference.selectedPlan = selectedPlan as ProviderPlan;
      }

      const features = getPlanFeatures(preference.selectedPlan);

      preference.featuredOnHomepage = features.canFeatureOnHomepage
        ? Boolean(featuredOnHomepage)
        : false;

      preference.profileBadgeText = features.canUseProfileBadge
        ? String(profileBadgeText || '').trim() || null
        : null;

      preference.autoReplyEnabled =
        autoReplyEnabled !== undefined
          ? Boolean(autoReplyEnabled)
          : preference.autoReplyEnabled;

      preference.autoReplyTone =
        autoReplyTone !== undefined
          ? String(autoReplyTone).trim() || 'professional'
          : preference.autoReplyTone;

      preference.autoReplySignature =
        autoReplySignature !== undefined
          ? String(autoReplySignature).trim() || null
          : preference.autoReplySignature;

      preference.privacyShowEmail =
        privacyShowEmail !== undefined
          ? Boolean(privacyShowEmail)
          : preference.privacyShowEmail;

      preference.privacyShowPhone =
        privacyShowPhone !== undefined
          ? Boolean(privacyShowPhone)
          : preference.privacyShowPhone;

      preference.privacyShowAddress =
        privacyShowAddress !== undefined
          ? Boolean(privacyShowAddress)
          : preference.privacyShowAddress;

      await AppDataSource.getRepository(ProviderPreference).save(preference);

      res.status(200).json({
        status: 'success',
        message: 'Provider preferences updated successfully',
        data: {
          preference,
          planFeatures: getPlanFeatures(preference.selectedPlan),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update provider preferences',
      });
    }
  }
);

router.post(
  '/me/ai-reply-preview',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const { customerMessage } = req.body;

      if (!customerMessage || !String(customerMessage).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Customer message is required',
        });
        return;
      }

      const providerRepository = AppDataSource.getRepository(ServiceProvider);
      const serviceRepository = AppDataSource.getRepository(Service);

      const provider = await providerRepository.findOne({
        where: { userId: req.user!.userId },
        relations: ['user', 'primaryCategory'],
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      const services = await serviceRepository.find({
        where: { providerId: provider.id },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });

      const result = buildReplyFromContext(
        provider,
        services,
        String(customerMessage).trim(),
        preference
      );

      res.status(200).json({
        status: 'success',
        message: 'AI reply preview generated successfully',
        data: {
          autoReplyEnabled: preference.autoReplyEnabled,
          selectedPlan: preference.selectedPlan,
          matchedServices: result.matchedServices,
          reply: result.reply,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate AI reply preview',
      });
    }
  }
);
router.get('/featured-providers', async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(ServiceProvider);

    const providers = await repo.find({
      relations: ['user', 'category', 'preference'],
      where: {
        preference: {
          featuredOnHomepage: true
        }
      },
      take: 8
    });

    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching featured providers' });
  }
});
router.get('/categories', async (req, res) => {
  try {
    const categories = await AppDataSource.getRepository(Category).find();
    res.json(categories);
  } catch {
    res.status(500).json({ message: 'Error fetching categories' });
  }
});
router.get('/latest-media', async (req, res) => {
  try {
    const media = await AppDataSource.getRepository(ProviderMedia).find({
      relations: ['provider', 'provider.user'],
      order: { createdAt: 'DESC' },
      take: 10
    });

    res.json(media);
  } catch {
    res.status(500).json({ message: 'Error fetching media' });
  }
});
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const providerRepository = AppDataSource.getRepository(ServiceProvider);

    const provider = await providerRepository.findOne({
      where: { id },
      relations: ['user', 'primaryCategory', 'services', 'preference'],
    });

    if (!provider) {
      res.status(404).json({
        status: 'error',
        message: 'Provider not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Provider fetched successfully',
      data: provider,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch provider',
    });
  }
});

export default router;
