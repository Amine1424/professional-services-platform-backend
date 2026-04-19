import { Request, Response, Router } from 'express';
import { MoreThan } from 'typeorm';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import { NotificationType } from '../models/AppNotification';
import Conversation, { ConversationStatus } from '../models/Conversation';
import ConversationMessage from '../models/ConversationMessage';
import ProviderPreference from '../models/ProviderPreference';
import Service, { ServiceStatus } from '../models/Service';
import ServiceProvider from '../models/ServiceProvider';
import { createNotification } from '../services/notificationService';

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

const safeNotify = async (input: Parameters<typeof createNotification>[0]) => {
  try {
    await createNotification(input);
  } catch (error) {
    console.error('Failed to create message notification', error);
  }
};

const updateConversationActivity = async (
  conversationId: string,
  patch: Partial<Conversation>
) => {
  await AppDataSource.getRepository(Conversation).update({ id: conversationId }, patch);
};

const buildReplyFromContext = (
  provider: ServiceProvider,
  services: Service[],
  customerMessage: string,
  preference: ProviderPreference
) => {
  const normalizedMessage = customerMessage.toLowerCase();
  const publishedServices = services.filter((service) => service.status === ServiceStatus.PUBLISHED);
  const sourceServices = publishedServices.length ? publishedServices : services;

  const scoredServices = sourceServices
    .map((service) => {
      const haystack =
        `${service.name} ${service.description} ${service.category?.name || ''}`.toLowerCase();
      const score = normalizedMessage
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);

      return {
        service,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.service)
    .slice(0, 3);

  const intro =
    preference.autoReplyTone === 'friendly'
      ? `Hello, this is ${provider.companyName}. Thanks for reaching out.`
      : preference.autoReplyTone === 'concise'
        ? `Hello, thanks for contacting ${provider.companyName}.`
        : `Hello, thank you for contacting ${provider.companyName}.`;

  const serviceLines = scoredServices.length
    ? scoredServices
        .map((service) => {
          const price = service.price ? ` - price: ${service.price} ${service.currencyCode}` : '';
          const badge =
            service.showPromoBadge && service.promoBadgeText
              ? ` - offer: ${service.promoBadgeText}`
              : '';

          return `- ${service.name}${price}${badge}`;
        })
        .join('\n')
    : '- We can help once we know a bit more about the requested scope and location.';

  const responseTime =
    provider.responseTimeMinutes > 0
      ? `We usually reply within about ${provider.responseTimeMinutes} minutes.`
      : 'We will reply as soon as possible.';

  const closing =
    'If you can, share a few more details such as city, expected scope, and budget so we can guide you more precisely.';
  const signature = preference.autoReplySignature ? `\n\n${preference.autoReplySignature}` : '';

  return {
    matchedServices: scoredServices,
    reply: `${intro}

Closest matching services:
${serviceLines}

${responseTime}
${closing}${signature}`,
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

  if (!conversation) {
    return null;
  }

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
      const preferences = providerIds.length
        ? await preferenceRepo.find({
            where: providerIds.map((providerId) => ({ providerId })),
          })
        : [];
      const preferenceMap = new Map(preferences.map((item) => [item.providerId, item]));

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

          const preference = preferenceMap.get(conversation.providerId);

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
              profileBadgeText: preference?.profileBadgeText || null,
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
    } catch (error) {
      console.error('Failed to fetch conversations', error);
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
      const query = conversationRepo
        .createQueryBuilder('conversation')
        .leftJoinAndSelect('conversation.provider', 'provider')
        .leftJoinAndSelect('conversation.customer', 'customer')
        .leftJoinAndSelect('conversation.service', 'service')
        .where('conversation.customer_user_id = :customerUserId', { customerUserId })
        .andWhere('conversation.provider_id = :providerId', { providerId });

      if (serviceId) {
        query.andWhere('conversation.service_id = :serviceId', { serviceId });
      } else {
        query.andWhere('conversation.service_id IS NULL');
      }

      let conversation = await query.getOne();

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
          status: ConversationStatus.OPEN,
          lastMessagePreview: null,
          lastMessageAt: null,
          lastReadCustomerAt: null,
          lastReadProviderAt: null,
        });

        await conversationRepo.save(conversation);
      }

      if (initialMessage && String(initialMessage).trim()) {
        const body = String(initialMessage).trim();
        const message = messageRepo.create({
          conversationId: conversation.id,
          senderUserId: customerUserId,
          senderRole: 'customer',
          body,
          isAiAssisted: false,
        });

        await messageRepo.save(message);

        await updateConversationActivity(conversation.id, {
          lastMessagePreview: body.slice(0, 500),
          lastMessageAt: new Date(),
          lastReadCustomerAt: new Date(),
          status: ConversationStatus.OPEN,
        });
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
    } catch (error) {
      console.error('Failed to create or open conversation', error);
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
              : 'User',
          })),
        },
      });
    } catch (error) {
      console.error('Failed to fetch conversation messages', error);
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
      const trimmedBody = String(body).trim();

      const message = AppDataSource.getRepository(ConversationMessage).create({
        conversationId,
        senderUserId: userId,
        senderRole,
        body: trimmedBody,
        isAiAssisted: Boolean(isAiAssisted),
      });

      await AppDataSource.getRepository(ConversationMessage).save(message);

      if (senderRole === 'customer') {
        await updateConversationActivity(conversation.id, {
          lastMessagePreview: trimmedBody.slice(0, 500),
          lastMessageAt: new Date(),
          lastReadCustomerAt: new Date(),
          status: ConversationStatus.OPEN,
        });
      } else {
        await updateConversationActivity(conversation.id, {
          lastMessagePreview: trimmedBody.slice(0, 500),
          lastMessageAt: new Date(),
          lastReadProviderAt: new Date(),
          status: ConversationStatus.OPEN,
        });
      }

      const saved = await AppDataSource.getRepository(ConversationMessage).findOne({
        where: { id: message.id },
        relations: ['sender'],
      });

      const recipientUserId =
        senderRole === 'customer' ? conversation.provider.userId : conversation.customerUserId;
      const senderDisplayName =
        senderRole === 'customer'
          ? `${conversation.customer.firstName} ${conversation.customer.lastName}`.trim()
          : conversation.provider.companyName;

      await safeNotify({
        recipientUserId,
        actorUserId: userId,
        type: NotificationType.MESSAGE,
        title: `New message from ${senderDisplayName}`,
        body: trimmedBody.slice(0, 180),
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
            : 'User',
        },
      });
    } catch (error) {
      console.error('Failed to send message', error);
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
        await updateConversationActivity(conversation.id, {
          lastReadCustomerAt: new Date(),
        });
      } else {
        await updateConversationActivity(conversation.id, {
          lastReadProviderAt: new Date(),
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Conversation marked as read',
      });
    } catch (error) {
      console.error('Failed to mark conversation as read', error);
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

      const result = buildReplyFromContext(provider, services, effectiveMessage, preference);

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
    } catch (error) {
      console.error('Failed to generate AI reply preview', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate AI reply preview',
      });
    }
  }
);

export default router;