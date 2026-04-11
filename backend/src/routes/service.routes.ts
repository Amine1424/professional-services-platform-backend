import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import {
  Service,
  ServiceDeliveryMode,
  ServiceStatus,
} from '../models/Service';
import { ServiceProvider } from '../models/ServiceProvider';
import { ProviderPlan, ProviderPreference } from '../models/ProviderPreference';

const router = Router();

const makeSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

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

const canUseFeaturedService = (plan: ProviderPlan) =>
  plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS;

const canUsePromoBadge = (plan: ProviderPlan) =>
  plan === ProviderPlan.PRO || plan === ProviderPlan.BUSINESS;

router.get('/', async (_req: Request, res: Response) => {
  try {
    const serviceRepository = AppDataSource.getRepository(Service);

    const services = await serviceRepository.find({
      relations: ['provider', 'provider.user', 'provider.primaryCategory', 'category'],
      order: {
        createdAt: 'DESC',
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Services fetched successfully',
      data: services,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch services',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const serviceRepository = AppDataSource.getRepository(Service);

    const service = await serviceRepository.findOne({
      where: { id },
      relations: ['provider', 'provider.user', 'provider.primaryCategory', 'category'],
    });

    if (!service) {
      res.status(404).json({
        status: 'error',
        message: 'Service not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Service fetched successfully',
      data: service,
    });
  } catch {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service',
    });
  }
});

router.post(
  '/',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const {
        categoryId,
        name,
        description,
        price,
        currencyCode,
        status,
        deliveryMode,
        responseTimeHours,
        isFeatured,
        showPromoBadge,
        promoBadgeText,
      } = req.body;

      if (!name || !String(name).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Service name is required',
        });
        return;
      }

      if (!description || !String(description).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Service description is required',
        });
        return;
      }

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

      const preference = await ensureProviderPreference(provider.id);

      if (Boolean(isFeatured) && !canUseFeaturedService(preference.selectedPlan)) {
        res.status(403).json({
          status: 'error',
          message: 'Featured services require Pro or Business plan',
        });
        return;
      }

      if (Boolean(showPromoBadge) && !canUsePromoBadge(preference.selectedPlan)) {
        res.status(403).json({
          status: 'error',
          message: 'Service promo badge requires Pro or Business plan',
        });
        return;
      }

      let slug = makeSlug(String(name));
      const existingSlug = await serviceRepository.findOne({
        where: { slug },
      });

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      const service = serviceRepository.create({
        providerId: provider.id,
        categoryId: categoryId || null,
        name: String(name).trim(),
        slug,
        description: String(description).trim(),
        price: price !== undefined && price !== null ? String(price) : null,
        currencyCode: currencyCode?.trim() || 'DZD',
        status:
          status && Object.values(ServiceStatus).includes(status)
            ? status
            : ServiceStatus.DRAFT,
        deliveryMode:
          deliveryMode && Object.values(ServiceDeliveryMode).includes(deliveryMode)
            ? deliveryMode
            : ServiceDeliveryMode.ON_SITE,
        responseTimeHours:
          responseTimeHours !== undefined ? Number(responseTimeHours) || 24 : 24,
        isFeatured: canUseFeaturedService(preference.selectedPlan)
          ? Boolean(isFeatured)
          : false,
        showPromoBadge: canUsePromoBadge(preference.selectedPlan)
          ? Boolean(showPromoBadge)
          : false,
        promoBadgeText: canUsePromoBadge(preference.selectedPlan)
          ? String(promoBadgeText || '').trim() || null
          : null,
      });

      await serviceRepository.save(service);

      const createdService = await serviceRepository.findOne({
        where: { id: service.id },
        relations: ['provider', 'provider.user', 'provider.primaryCategory', 'category'],
      });

      res.status(201).json({
        status: 'success',
        message: 'Service created successfully',
        data: createdService,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create service',
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
      const id = String(req.params.id);
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

      const preference = await ensureProviderPreference(provider.id);

      const service = await serviceRepository.findOne({
        where: { id, providerId: provider.id },
      });

      if (!service) {
        res.status(404).json({
          status: 'error',
          message: 'Service not found',
        });
        return;
      }

      const {
        categoryId,
        name,
        description,
        price,
        currencyCode,
        status,
        deliveryMode,
        responseTimeHours,
        isFeatured,
        showPromoBadge,
        promoBadgeText,
      } = req.body;

      if (Boolean(isFeatured) && !canUseFeaturedService(preference.selectedPlan)) {
        res.status(403).json({
          status: 'error',
          message: 'Featured services require Pro or Business plan',
        });
        return;
      }

      if (Boolean(showPromoBadge) && !canUsePromoBadge(preference.selectedPlan)) {
        res.status(403).json({
          status: 'error',
          message: 'Service promo badge requires Pro or Business plan',
        });
        return;
      }

      if (name && String(name).trim() !== service.name) {
        let slug = makeSlug(String(name));
        const existingSlug = await serviceRepository.findOne({
          where: { slug },
        });

        if (existingSlug && existingSlug.id !== service.id) {
          slug = `${slug}-${Date.now()}`;
        }

        service.name = String(name).trim();
        service.slug = slug;
      }

      service.categoryId =
        categoryId !== undefined ? categoryId || null : service.categoryId;

      service.description =
        description !== undefined ? String(description).trim() : service.description;

      service.price =
        price !== undefined && price !== null ? String(price) : service.price;

      service.currencyCode =
        currencyCode !== undefined
          ? String(currencyCode).trim() || 'DZD'
          : service.currencyCode;

      service.status =
        status && Object.values(ServiceStatus).includes(status)
          ? status
          : service.status;

      service.deliveryMode =
        deliveryMode && Object.values(ServiceDeliveryMode).includes(deliveryMode)
          ? deliveryMode
          : service.deliveryMode;

      service.responseTimeHours =
        responseTimeHours !== undefined
          ? Number(responseTimeHours) || 24
          : service.responseTimeHours;

      service.isFeatured =
        isFeatured !== undefined
          ? canUseFeaturedService(preference.selectedPlan)
            ? Boolean(isFeatured)
            : false
          : service.isFeatured;

      service.showPromoBadge =
        showPromoBadge !== undefined
          ? canUsePromoBadge(preference.selectedPlan)
            ? Boolean(showPromoBadge)
            : false
          : service.showPromoBadge;

      service.promoBadgeText =
        promoBadgeText !== undefined
          ? canUsePromoBadge(preference.selectedPlan)
            ? String(promoBadgeText).trim() || null
            : null
          : service.promoBadgeText;

      await serviceRepository.save(service);

      const updatedService = await serviceRepository.findOne({
        where: { id: service.id },
        relations: ['provider', 'provider.user', 'provider.primaryCategory', 'category'],
      });

      res.status(200).json({
        status: 'success',
        message: 'Service updated successfully',
        data: updatedService,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update service',
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
      const id = String(req.params.id);
      const serviceRepository = AppDataSource.getRepository(Service);

      const service = await serviceRepository.findOne({
        where: { id },
      });

      if (!service) {
        res.status(404).json({
          status: 'error',
          message: 'Service not found',
        });
        return;
      }

      await serviceRepository.remove(service);

      res.status(200).json({
        status: 'success',
        message: 'Service deleted successfully',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete service',
      });
    }
  }
);

export default router;