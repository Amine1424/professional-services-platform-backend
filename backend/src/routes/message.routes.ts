import { Request, Response, Router } from 'express';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import Conversation from '../models/Conversation';
import ConversationMessage from '../models/ConversationMessage';
import ProviderPreference from '../models/ProviderPreference';
import ServiceProvider from '../models/ServiceProvider';
import Service, { ServiceStatus } from '../models/Service';
import User from '../models/User';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../models/AppNotification';

const router = Router();

const getProviderForUser = async (userId: string) => {
  return await AppDataSource.getRepository(ServiceProvider).findOne({
    where: { userId },
    relations: ['user', 'primaryCategory'],
  });
};

const ensureProviderPreference = async (providerId: string) => {
  const repository = AppDataSource.getRepository(ProviderPreference);

  let preference = await repository.findOne({
    where: { providerId },
  });

  if (!preference) {
    preference = repository.create({
      providerId,
      selectedPlan: 'basic' as any,
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

const conversationBelongsToUser = async (
  conversationId: string,
  userId: string,
  role: string
) => {
  const conversationRepo = AppDataSource.getRepository(Conversation);

  const conversation = await conversationRepo.findOne({
    where: { id: conversationId },
    relations: ['provider', 'provider.user', 'customer', 'service'],
  });

  if (!conversation) return null;

  if (role === 'customer' && conversation.customerUserId === userId) {
    return conversation;
  }

  if (role === 'service_provider') {
    const provider = await getProviderForUser(userId);
    if (provider && conversation.providerId === provider.id) {
      return conversation;
    }
  }

  return null;
};

router.get(
  '/conversations',
  authMiddleware,
  authorizeRole('customer', 'service_provider'),
  async (req: Request, res: Response) => {
    try {
      const role = req.user!.role;
      const userId = req.user!.userId;

      const conversationRepo = AppDataSource.getRepository(Conversation);
      const messageRepo = AppDataSource.getRepository(ConversationMessage);
      const preferenceRepo = AppDataSource.getRepository(ProviderPreference);

      let conversations: Conversation[] = [];

      if (role === 'customer') {
        conversations = await conversationRepo.find({
          where: { customerUserId: userId },
          relations: ['provider', 'provider.user', 'customer', 'service'],
          order: {
            lastMessageAt: 'DESC',
            createdAt: 'DESC',
          },
        });
      } else {
        const provider = await getProviderForUser(userId);

        if (!provider) {
          res.status(404).json({
            status: 'error',
            message: 'Provider profile not found',
          });
          return;
        }

        conversations = await conversationRepo.find({
          where: { providerId: provider.id },
          relations: ['provider', 'provider.user', 'customer', 'service'],
          order: {
            lastMessageAt: 'DESC',
            createdAt: 'DESC',
          },
        });
      }

      const providerIds = Array.from(new Set(conversations.map((item) => item.providerId)));
      const prefs = providerIds.length
        ? await preferenceRepo.find({
            where: providerIds.map((providerId) => ({ providerId })),
          })
        : [];

      const prefMap = new Map(prefs.map((item) => [item.providerId, item]));

      const items = await Promise.all(
        conversations.map(async (conversation) => {
          const unreadCount =
            role === 'customer'
              ? await messageRepo.count({
                  where: {
                    conversationId: conversation.id,
                    senderRole: 'service_provider',
                    ...(conversation.lastReadCustomerAt
                      ? { createdAt: MoreThan(conversation.lastReadCustomerAt) }
                      : {}),
                  },
                })
              : await messageRepo.count({
                  where: {
                    conversationId: conversation.id,
                    senderRole: 'customer',
                    ...(conversation.lastReadProviderAt
                      ? { createdAt: MoreThan(conversation.lastReadProviderAt) }
                      : {}),
                  },
                });

          const pref = prefMap.get(conversation.providerId);

          return {
            id: conversation.id,
            subject: conversation.subject,
            status: conversation.status,
            lastMessagePreview: conversation.lastMessagePreview,
            lastMessageAt: conversation.lastMessageAt,
            unreadCount,
            service: conversation.service
              ? {
                  id: conversation.service.id,
                  name: conversation.service.name,
                }
              : null,
            provider: {
              id: conversation.provider.id,
              companyName: conversation.provider.companyName,
              avatarUrl: conversation.provider.avatarUrl,
              isVerified: conversation.provider.isVerified,
              profileBadgeText: pref?.profileBadgeText || null,
            },
            customer: {
              id: conversation.customer.id,
              firstName: conversation.customer.firstName,
              lastName: conversation.customer.lastName,
              email: conversation.customer.email,
            },
          };
        })
      );

      res.status(200).json({
        status: 'success',
        message: 'Conversations fetched successfully',
        data: items,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch conversations',
      });
    }
  }
);

router.post(
  '/conversations',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const customerUserId = req.user!.userId;
      const { providerId, serviceId, initialMessage } = req.body;

      if (!providerId) {
        res.status(400).json({
          status: 'error',
          message: 'providerId is required',
        });
        return;
      }

      const provider = await AppDataSource.getRepository(ServiceProvider).findOne({
        where: { id: providerId },
        relations: ['user'],
      });

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider not found',
        });
        return;
      }

      if (serviceId) {
        const service = await AppDataSource.getRepository(Service).findOne({
          where: { id: serviceId, providerId: provider.id },
        });

        if (!service) {
          res.status(400).json({
            status: 'error',
            message: 'Selected service does not belong to this provider',
          });
          return;
        }
      }

      const conversationRepo = AppDataSource.getRepository(Conversation);
      const messageRepo = AppDataSource.getRepository(ConversationMessage);

      const qb = conversationRepo
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.provider', 'provider')
        .leftJoinAndSelect('conversation.customer', 'customer')
        .leftJoinAndSelect('conversation.service', 'service')
        .where('conversation.customer_user_id = :customerUserId', { customerUserId })
        .andWhere('conversation.provider_id = :providerId', { providerId });

      if (serviceId) {
        qb.andWhere('conversation.service_id = :serviceId', { serviceId });
      } else {
        qb.andWhere('conversation.service_id IS NULL');
      }

      let conversation = await qb.getOne();

      if (!conversation) {
        let subject: string | null = provider.companyName;

        if (serviceId) {
          const service = await AppDataSource.getRepository(Service).findOne({
            where: { id: serviceId },
          });
          subject = service?.name || provider.companyName;
        }

        conversation = conversationRepo.create({
          customerUserId,
          providerId,
          serviceId: serviceId || null,
          subject,
          status: 'open' as any,
          lastMessagePreview: null,
          lastMessageAt: null,
          lastReadCustomerAt: null,
          lastReadProviderAt: null,
        });

        await conversationRepo.save(conversation);
      }

      if (initialMessage && String(initialMessage).trim()) {
        const message = messageRepo.create({
          conversationId: conversation.id,
          senderUserId: customerUserId,
          senderRole: 'customer',
          body: String(initialMessage).trim(),
          isAiAssisted: false,
        });

        await messageRepo.save(message);

        conversation.lastMessagePreview = String(initialMessage).trim().slice(0, 500);
        conversation.lastMessageAt = new Date();
        conversation.lastReadCustomerAt = new Date();

        await conversationRepo.save(conversation);
      }

      const result = await conversationRepo.findOne({
        where: { id: conversation.id },
        relations: ['provider', 'provider.user', 'customer', 'service'],
      });

      res.status(200).json({
        status: 'success',
        message: 'Conversation created or opened successfully',
        data: result,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create or open conversation',
      });
    }
  }
);

router.get(
  '/conversations/:id/messages',
  authMiddleware,
  authorizeRole('customer', 'service_provider'),
  async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const userId = req.user!.userId;
      const role = req.user!.role;

      const conversation = await conversationBelongsToUser(conversationId, userId, role);

      if (!conversation) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
        return;
      }

      const messages = await AppDataSource.getRepository(ConversationMessage).find({
        where: { conversationId },
        relations: ['sender'],
        order: { createdAt: 'ASC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Conversation messages fetched successfully',
        data: {
          conversation: {
            id: conversation.id,
            subject: conversation.subject,
            provider: {
              id: conversation.provider.id,
              companyName: conversation.provider.companyName,
              avatarUrl: conversation.provider.avatarUrl,
            },
            customer: {
              id: conversation.customer.id,
              firstName: conversation.customer.firstName,
              lastName: conversation.customer.lastName,
            },
            service: conversation.service
              ? {
                  id: conversation.service.id,
                  name: conversation.service.name,
                }
              : null,
          },
          messages: messages.map((message) => ({
            id: message.id,
            conversationId: message.conversationId,
            senderUserId: message.senderUserId,
            senderRole: message.senderRole,
            body: message.body,
            isAiAssisted: message.isAiAssisted,
            createdAt: message.createdAt,
            senderName: message.sender
              ? `${message.sender.firstName} ${message.sender.lastName}`.trim()
              : 'Utilisateur',
          })),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch conversation messages',
      });
    }
  }
);

router.post(
  '/conversations/:id/messages',
  authMiddleware,
  authorizeRole('customer', 'service_provider'),
  async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { body, isAiAssisted } = req.body;

      if (!body || !String(body).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Message body is required',
        });
        return;
      }

      const conversation = await conversationBelongsToUser(conversationId, userId, role);

      if (!conversation) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
        return;
      }

      const senderRole = role === 'customer' ? 'customer' : 'service_provider';

      const message = AppDataSource.getRepository(ConversationMessage).create({
        conversationId,
        senderUserId: userId,
        senderRole,
        body: String(body).trim(),
        isAiAssisted: Boolean(isAiAssisted),
      });

      await AppDataSource.getRepository(ConversationMessage).save(message);

      conversation.lastMessagePreview = String(body).trim().slice(0, 500);
      conversation.lastMessageAt = new Date();

      if (senderRole === 'customer') {
        conversation.lastReadCustomerAt = new Date();
      } else {
        conversation.lastReadProviderAt = new Date();
      }

      await AppDataSource.getRepository(Conversation).save(conversation);

      const saved = await AppDataSource.getRepository(ConversationMessage).findOne({
        where: { id: message.id },
        relations: ['sender'],
      });

const recipientUserId =
  senderRole === 'customer'
    ? conversation.provider.userId
    : conversation.customerUserId;

const senderDisplayName =
  senderRole === 'customer'
    ? `${conversation.customer.firstName} ${conversation.customer.lastName}`.trim()
    : conversation.provider.companyName;

await createNotification({
  recipientUserId,
  actorUserId: userId,
  type: NotificationType.MESSAGE,
  title: `رسالة جديدة من ${senderDisplayName}`,
  body: String(body).trim().slice(0, 180),
  link:
    senderRole === 'customer'
      ? `/provider/messages?conversationId=${conversation.id}`
      : `/customer/messages?conversationId=${conversation.id}`,
  metadataJson: {
    conversationId: conversation.id,
  },
});
      res.status(201).json({
        status: 'success',
        message: 'Message sent successfully',
        data: {
          id: saved!.id,
          conversationId: saved!.conversationId,
          senderUserId: saved!.senderUserId,
          senderRole: saved!.senderRole,
          body: saved!.body,
          isAiAssisted: saved!.isAiAssisted,
          createdAt: saved!.createdAt,
          senderName: saved!.sender
            ? `${saved!.sender.firstName} ${saved!.sender.lastName}`.trim()
            : 'Utilisateur',
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send message',
      });
    }
  }
);

router.post(
  '/conversations/:id/read',
  authMiddleware,
  authorizeRole('customer', 'service_provider'),
  async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const userId = req.user!.userId;
      const role = req.user!.role;

      const conversation = await conversationBelongsToUser(conversationId, userId, role);

      if (!conversation) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
        return;
      }

      if (role === 'customer') {
        conversation.lastReadCustomerAt = new Date();
      } else {
        conversation.lastReadProviderAt = new Date();
      }

      await AppDataSource.getRepository(Conversation).save(conversation);

      res.status(200).json({
        status: 'success',
        message: 'Conversation marked as read',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark conversation as read',
      });
    }
  }
);

router.post(
  '/conversations/:id/ai-reply-preview',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const conversationId = String(req.params.id);
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { customerMessage } = req.body;

      const conversation = await conversationBelongsToUser(conversationId, userId, role);

      if (!conversation) {
        res.status(404).json({
          status: 'error',
          message: 'Conversation not found',
        });
        return;
      }

      const provider = await getProviderForUser(userId);

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const preference = await ensureProviderPreference(provider.id);

      const services = await AppDataSource.getRepository(Service).find({
        where: { providerId: provider.id },
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });

      let effectiveMessage = String(customerMessage || '').trim();

      if (!effectiveMessage) {
        const latestCustomerMessage = await AppDataSource.getRepository(ConversationMessage).findOne({
          where: {
            conversationId,
            senderRole: 'customer',
          },
          order: { createdAt: 'DESC' },
        });

        effectiveMessage = latestCustomerMessage?.body || '';
      }

      if (!effectiveMessage) {
        res.status(400).json({
          status: 'error',
          message: 'No customer message found to generate AI reply',
        });
        return;
      }

      const result = buildReplyFromContext(
        provider,
        services,
        effectiveMessage,
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

export default router;