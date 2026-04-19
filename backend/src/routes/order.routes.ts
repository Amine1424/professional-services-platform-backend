import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import { NotificationType } from '../models/AppNotification';
import Conversation, { ConversationStatus } from '../models/Conversation';
import ConversationMessage from '../models/ConversationMessage';
import Service from '../models/Service';
import ServiceProvider from '../models/ServiceProvider';
import ServiceRequest, { ServiceRequestStatus } from '../models/ServiceRequest';
import { createNotification } from '../services/notificationService';

const router = Router();

const getProviderForUser = async (userId: string) => {
  return await AppDataSource.getRepository(ServiceProvider).findOne({
    where: { userId },
    relations: ['user', 'primaryCategory'],
  });
};

const openOrCreateConversation = async (
  customerUserId: string,
  providerId: string,
  serviceId?: string | null,
  initialMessage?: string | null
) => {
  const conversationRepo = AppDataSource.getRepository(Conversation);
  const messageRepo = AppDataSource.getRepository(ConversationMessage);
  const serviceRepo = AppDataSource.getRepository(Service);
  const providerRepo = AppDataSource.getRepository(ServiceProvider);

  const provider = await providerRepo.findOne({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error('Provider not found');
  }

  const query = conversationRepo
    .createQueryBuilder('conversation')
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
      const service = await serviceRepo.findOne({
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
    const messageBody = String(initialMessage).trim();
    const message = messageRepo.create({
      conversationId: conversation.id,
      senderUserId: customerUserId,
      senderRole: 'customer',
      body: messageBody,
      isAiAssisted: false,
    });

    await messageRepo.save(message);

    conversation.lastMessagePreview = messageBody.slice(0, 500);
    conversation.lastMessageAt = new Date();
    conversation.lastReadCustomerAt = new Date();

    await conversationRepo.save(conversation);
  }

  return conversation;
};

const appendTimelineMessage = async (
  conversationId: string,
  senderUserId: string,
  senderRole: 'customer' | 'service_provider',
  body: string
) => {
  const messageRepo = AppDataSource.getRepository(ConversationMessage);
  const conversationRepo = AppDataSource.getRepository(Conversation);

  const message = messageRepo.create({
    conversationId,
    senderUserId,
    senderRole,
    body,
    isAiAssisted: false,
  });

  await messageRepo.save(message);

  const conversation = await conversationRepo.findOne({
    where: { id: conversationId },
  });

  if (!conversation) {
    return;
  }

  conversation.lastMessagePreview = body.slice(0, 500);
  conversation.lastMessageAt = new Date();

  if (senderRole === 'customer') {
    conversation.lastReadCustomerAt = new Date();
  } else {
    conversation.lastReadProviderAt = new Date();
  }

  await conversationRepo.save(conversation);
};

const safeAppendTimelineMessage = async (
  conversationId: string,
  senderUserId: string,
  senderRole: 'customer' | 'service_provider',
  body: string
) => {
  try {
    await appendTimelineMessage(conversationId, senderUserId, senderRole, body);
  } catch (error) {
    console.error('Failed to append request timeline message', error);
  }
};

const safeNotify = async (input: Parameters<typeof createNotification>[0]) => {
  try {
    await createNotification(input);
  } catch (error) {
    console.error('Failed to create request notification', error);
  }
};

const parseOptionalMoney = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return { value: null as string | null };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { error: 'Budget values must be valid positive numbers.' };
  }

  return { value: parsed.toFixed(2) };
};

const parseOptionalDate = (value: unknown) => {
  if (!value) {
    return { value: null as Date | null };
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return { error: 'Preferred date is invalid.' };
  }

  return { value: parsed };
};

router.post('/', authMiddleware, authorizeRole('customer'), async (req: Request, res: Response) => {
  try {
    const customerUserId = req.user!.userId;
    const {
      providerId,
      serviceId,
      subject,
      description,
      budgetMin,
      budgetMax,
      currencyCode,
      preferredDate,
      initialMessage,
    } = req.body;

    if (!providerId) {
      res.status(400).json({
        status: 'error',
        message: 'providerId is required',
      });
      return;
    }

    if (!description || !String(description).trim()) {
      res.status(400).json({
        status: 'error',
        message: 'description is required',
      });
      return;
    }

    const parsedBudgetMin = parseOptionalMoney(budgetMin);
    if ('error' in parsedBudgetMin) {
      res.status(400).json({
        status: 'error',
        message: parsedBudgetMin.error,
      });
      return;
    }

    const parsedBudgetMax = parseOptionalMoney(budgetMax);
    if ('error' in parsedBudgetMax) {
      res.status(400).json({
        status: 'error',
        message: parsedBudgetMax.error,
      });
      return;
    }

    if (
      parsedBudgetMin.value !== null &&
      parsedBudgetMax.value !== null &&
      Number(parsedBudgetMin.value) > Number(parsedBudgetMax.value)
    ) {
      res.status(400).json({
        status: 'error',
        message: 'Budget minimum cannot be greater than budget maximum',
      });
      return;
    }

    const parsedPreferredDate = parseOptionalDate(preferredDate);
    if ('error' in parsedPreferredDate) {
      res.status(400).json({
        status: 'error',
        message: parsedPreferredDate.error,
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

    let service: Service | null = null;

    if (serviceId) {
      service = await AppDataSource.getRepository(Service).findOne({
        where: { id: serviceId, providerId },
      });

      if (!service) {
        res.status(400).json({
          status: 'error',
          message: 'Selected service does not belong to this provider',
        });
        return;
      }
    }

    const conversation = await openOrCreateConversation(
      customerUserId,
      providerId,
      serviceId || null,
      initialMessage || description
    );

    const requestRepo = AppDataSource.getRepository(ServiceRequest);
    const createdRequest = requestRepo.create({
      customerUserId,
      providerId,
      serviceId: serviceId || null,
      conversationId: conversation.id,
      subject: String(subject || service?.name || provider.companyName).trim() || null,
      description: String(description).trim(),
      budgetMin: parsedBudgetMin.value,
      budgetMax: parsedBudgetMax.value,
      quotedPrice: null,
      currencyCode: String(currencyCode || 'DZD').trim() || 'DZD',
      providerResponse: null,
      customerNote: null,
      preferredDate: parsedPreferredDate.value,
      status: ServiceRequestStatus.NEW,
    });

    await requestRepo.save(createdRequest);

    await safeAppendTimelineMessage(
      conversation.id,
      customerUserId,
      'customer',
      `New service request created: ${createdRequest.subject || 'Service request'}`
    );

    if (provider.userId) {
      const senderName = String(req.user?.email || '').trim();

      await safeNotify({
        recipientUserId: provider.userId,
        actorUserId: customerUserId,
        type: NotificationType.REQUEST,
        title: 'New service request',
        body: senderName
          ? `${senderName}: ${createdRequest.subject || 'Service request'}`
          : createdRequest.subject || 'Service request',
        link: `/provider/requests?requestId=${createdRequest.id}`,
        metadataJson: {
          requestId: createdRequest.id,
          conversationId: conversation.id,
        },
      });
    }

    const result = await requestRepo.findOne({
      where: { id: createdRequest.id },
      relations: ['provider', 'provider.user', 'customer', 'service'],
    });

    res.status(201).json({
      status: 'success',
      message: 'Service request created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to create service request', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create service request',
    });
  }
});

router.get(
  '/customer',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const requests = await AppDataSource.getRepository(ServiceRequest).find({
        where: { customerUserId: req.user!.userId },
        relations: ['provider', 'provider.user', 'service'],
        order: { createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Customer service requests fetched successfully',
        data: requests.map((item) => ({
          id: item.id,
          subject: item.subject,
          description: item.description,
          budgetMin: item.budgetMin,
          budgetMax: item.budgetMax,
          quotedPrice: item.quotedPrice,
          currencyCode: item.currencyCode,
          providerResponse: item.providerResponse,
          customerNote: item.customerNote,
          preferredDate: item.preferredDate,
          status: item.status,
          conversationId: item.conversationId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          provider: {
            id: item.provider.id,
            companyName: item.provider.companyName,
            avatarUrl: item.provider.avatarUrl,
            isVerified: item.provider.isVerified,
          },
          service: item.service
            ? {
                id: item.service.id,
                name: item.service.name,
              }
            : null,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch customer service requests', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer service requests',
      });
    }
  }
);

router.get(
  '/provider',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const provider = await getProviderForUser(req.user!.userId);

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const requests = await AppDataSource.getRepository(ServiceRequest).find({
        where: { providerId: provider.id },
        relations: ['customer', 'service'],
        order: { createdAt: 'DESC' },
      });

      res.status(200).json({
        status: 'success',
        message: 'Provider service requests fetched successfully',
        data: requests.map((item) => ({
          id: item.id,
          subject: item.subject,
          description: item.description,
          budgetMin: item.budgetMin,
          budgetMax: item.budgetMax,
          quotedPrice: item.quotedPrice,
          currencyCode: item.currencyCode,
          providerResponse: item.providerResponse,
          customerNote: item.customerNote,
          preferredDate: item.preferredDate,
          status: item.status,
          conversationId: item.conversationId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          customer: {
            id: item.customer.id,
            firstName: item.customer.firstName,
            lastName: item.customer.lastName,
            email: item.customer.email,
            phoneNumber: item.customer.phoneNumber,
          },
          service: item.service
            ? {
                id: item.service.id,
                name: item.service.name,
              }
            : null,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch provider service requests', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch provider service requests',
      });
    }
  }
);

router.patch(
  '/:id/provider',
  authMiddleware,
  authorizeRole('service_provider'),
  async (req: Request, res: Response) => {
    try {
      const requestId = String(req.params.id);
      const { status, quotedPrice, providerResponse } = req.body;

      const provider = await getProviderForUser(req.user!.userId);

      if (!provider) {
        res.status(404).json({
          status: 'error',
          message: 'Provider profile not found',
        });
        return;
      }

      const requestRepo = AppDataSource.getRepository(ServiceRequest);
      const serviceRequest = await requestRepo.findOne({
        where: { id: requestId, providerId: provider.id },
      });

      if (!serviceRequest) {
        res.status(404).json({
          status: 'error',
          message: 'Service request not found',
        });
        return;
      }

      const allowedStatuses = [
        ServiceRequestStatus.REVIEWED,
        ServiceRequestStatus.QUOTED,
        ServiceRequestStatus.IN_PROGRESS,
        ServiceRequestStatus.COMPLETED,
        ServiceRequestStatus.REJECTED,
      ];

      if (status && !allowedStatuses.includes(status)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid provider status',
        });
        return;
      }

      const parsedQuote = parseOptionalMoney(quotedPrice);
      if ('error' in parsedQuote) {
        res.status(400).json({
          status: 'error',
          message: parsedQuote.error,
        });
        return;
      }

      serviceRequest.quotedPrice =
        quotedPrice !== undefined ? parsedQuote.value : serviceRequest.quotedPrice;
      serviceRequest.providerResponse =
        providerResponse !== undefined
          ? String(providerResponse).trim() || null
          : serviceRequest.providerResponse;

      if (status) {
        serviceRequest.status = status;
      } else if (quotedPrice !== undefined && parsedQuote.value !== null) {
        serviceRequest.status = ServiceRequestStatus.QUOTED;
      }

      await requestRepo.save(serviceRequest);

      if (serviceRequest.conversationId) {
        const text = `Provider updated the request to ${serviceRequest.status}${
          serviceRequest.quotedPrice
            ? ` - quote: ${serviceRequest.quotedPrice} ${serviceRequest.currencyCode}`
            : ''
        }${serviceRequest.providerResponse ? ` - note: ${serviceRequest.providerResponse}` : ''}`;

        await safeAppendTimelineMessage(
          serviceRequest.conversationId,
          req.user!.userId,
          'service_provider',
          text
        );

        await safeNotify({
          recipientUserId: serviceRequest.customerUserId,
          actorUserId: req.user!.userId,
          type: NotificationType.REQUEST,
          title: 'Service request updated',
          body: `Status: ${serviceRequest.status}${
            serviceRequest.quotedPrice
              ? ` - quote: ${serviceRequest.quotedPrice} ${serviceRequest.currencyCode}`
              : ''
          }`,
          link: `/customer/orders?requestId=${serviceRequest.id}`,
          metadataJson: {
            requestId: serviceRequest.id,
            conversationId: serviceRequest.conversationId,
          },
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Provider request update saved successfully',
        data: serviceRequest,
      });
    } catch (error) {
      console.error('Failed to update provider service request', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update provider service request',
      });
    }
  }
);

router.patch(
  '/:id/customer',
  authMiddleware,
  authorizeRole('customer'),
  async (req: Request, res: Response) => {
    try {
      const requestId = String(req.params.id);
      const { status, customerNote } = req.body;

      const requestRepo = AppDataSource.getRepository(ServiceRequest);
      const serviceRequest = await requestRepo.findOne({
        where: { id: requestId, customerUserId: req.user!.userId },
      });

      if (!serviceRequest) {
        res.status(404).json({
          status: 'error',
          message: 'Service request not found',
        });
        return;
      }

      const allowedStatuses = [
        ServiceRequestStatus.ACCEPTED,
        ServiceRequestStatus.REJECTED,
        ServiceRequestStatus.CANCELLED,
      ];

      if (!status || !allowedStatuses.includes(status)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid customer status',
        });
        return;
      }

      serviceRequest.status = status;
      serviceRequest.customerNote =
        customerNote !== undefined
          ? String(customerNote).trim() || null
          : serviceRequest.customerNote;

      await requestRepo.save(serviceRequest);

      if (serviceRequest.conversationId) {
        const text = `Customer updated the request to ${serviceRequest.status}${
          serviceRequest.customerNote ? ` - note: ${serviceRequest.customerNote}` : ''
        }`;

        await safeAppendTimelineMessage(
          serviceRequest.conversationId,
          req.user!.userId,
          'customer',
          text
        );

        const provider = await AppDataSource.getRepository(ServiceProvider).findOne({
          where: { id: serviceRequest.providerId },
        });

        if (provider?.userId) {
          await safeNotify({
            recipientUserId: provider.userId,
            actorUserId: req.user!.userId,
            type: NotificationType.REQUEST,
            title: 'Customer updated a request',
            body: `Status: ${serviceRequest.status}`,
            link: `/provider/requests?requestId=${serviceRequest.id}`,
            metadataJson: {
              requestId: serviceRequest.id,
              conversationId: serviceRequest.conversationId,
            },
          });
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Customer request update saved successfully',
        data: serviceRequest,
      });
    } catch (error) {
      console.error('Failed to update customer service request', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update customer service request',
      });
    }
  }
);

export default router;
