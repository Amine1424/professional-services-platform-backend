import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import AppNotification, { NotificationType } from '../models/AppNotification';
import { ModerationDecision } from '../models/ProviderModerationReview';
import User from '../models/User';
import { createNotification } from '../services/notificationService';
import {
  buildReviewSubjectSummary,
  getReviewThreadListForUser,
  isReviewThreadMetadata,
  markReviewThreadAsRead,
  type ReviewThreadMetadata,
  type ReviewSubjectType,
  saveModerationDecision,
} from '../services/moderationService';

const router = Router();

const allowedRoles = ['admin', 'super_admin', 'reviewer'] as const;

type AppNotificationWithReviewThreadMetadata = AppNotification & {
  metadataJson: ReviewThreadMetadata;
};

const hasReviewThreadMetadata = (
  notification: AppNotification
): notification is AppNotificationWithReviewThreadMetadata => {
  return isReviewThreadMetadata(notification.metadataJson);
};

const getInboxLink = (role: string, threadId: string) =>
  role === 'reviewer'
    ? `/reviewer/inbox?threadId=${encodeURIComponent(threadId)}`
    : `/admin/review-inbox?threadId=${encodeURIComponent(threadId)}`;

const getThreadNotifications = async (threadId: string) => {
  const notifications = await AppDataSource.getRepository(AppNotification).find({
    order: { createdAt: 'ASC' },
  });

  return notifications.filter((notification) => {
    const metadata = notification.metadataJson;
    return isReviewThreadMetadata(metadata) && metadata.threadId === threadId;
  });
};

const getThreadForUser = async (threadId: string, userId: string) => {
  const notifications = await getThreadNotifications(threadId);

  if (!notifications.length) {
    return null;
  }

  const visibleNotifications = notifications.filter(
    (notification) =>
      notification.recipientUserId === userId || notification.actorUserId === userId
  );

  if (!visibleNotifications.length) {
    return null;
  }

  const reviewNotifications = visibleNotifications.filter(hasReviewThreadMetadata);

  if (!reviewNotifications.length) {
    return null;
  }

  const baseMetadata = reviewNotifications[0].metadataJson;
  const subject = await buildReviewSubjectSummary(
    baseMetadata.subjectType,
    baseMetadata.subjectId
  );

  if (!subject) {
    return null;
  }

  const userIds = Array.from(
    new Set(
      reviewNotifications.flatMap((item) =>
        [item.actorUserId, item.recipientUserId].filter(Boolean) as string[]
      )
    )
  );

  const users = userIds.length
    ? await AppDataSource.getRepository(User).find({
        where: { id: In(userIds) },
      })
    : [];

  const userMap = new Map(users.map((user) => [user.id, user]));

  return {
    metadata: baseMetadata,
    subject,
    messages: reviewNotifications.map((notification) => {
      const metadata = notification.metadataJson;
      const sender = notification.actorUserId ? userMap.get(notification.actorUserId) : null;
      const recipient = userMap.get(notification.recipientUserId) || null;

      return {
        id: notification.id,
        body: notification.body,
        title: notification.title,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
        senderUserId: notification.actorUserId,
        senderRole: sender?.role || 'system',
        senderName: sender
          ? `${sender.firstName} ${sender.lastName}`.trim() || sender.email
          : 'System',
        recipientName: recipient
          ? `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.email
          : 'Recipient',
        messageKind: metadata.messageKind || 'message',
        decision: metadata.decision || null,
      };
    }),
  };
};

router.get(
  '/',
  authMiddleware,
  authorizeRole(...allowedRoles),
  async (req: Request, res: Response) => {
    try {
      const items = await getReviewThreadListForUser(req.user!.userId);
      const userRepo = AppDataSource.getRepository(User);
      const reviewerIds = Array.from(
        new Set(items.map((item) => item.metadata.reviewerUserId))
      );
      const adminIds = Array.from(new Set(items.map((item) => item.metadata.adminUserId)));
      const users = await userRepo.find({
        where: { id: In([...reviewerIds, ...adminIds]) },
      });
      const userMap = new Map(users.map((user) => [user.id, user]));

      res.status(200).json({
        status: 'success',
        message: 'Review threads fetched successfully',
        data: items.map((item) => {
          const reviewer = userMap.get(item.metadata.reviewerUserId);
          const admin = userMap.get(item.metadata.adminUserId);

          return {
            threadId: item.threadId,
            unreadCount: item.unreadCount,
            subject: item.subject,
            reviewer: reviewer
              ? {
                  id: reviewer.id,
                  firstName: reviewer.firstName,
                  lastName: reviewer.lastName,
                  email: reviewer.email,
                }
              : null,
            admin: admin
              ? {
                  id: admin.id,
                  firstName: admin.firstName,
                  lastName: admin.lastName,
                  email: admin.email,
                }
              : null,
            lastMessage: {
              id: item.lastMessage.id,
              body: item.lastMessage.body,
              createdAt: item.lastMessage.createdAt,
              actorUserId: item.lastMessage.actorUserId,
            },
          };
        }),
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch review threads',
      });
    }
  }
);

router.post(
  '/',
  authMiddleware,
  authorizeRole('admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { reviewerUserId, subjectType, subjectId, body } = req.body;

      if (!reviewerUserId || !String(reviewerUserId).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Reviewer is required',
        });
        return;
      }

      if (!body || !String(body).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Message body is required',
        });
        return;
      }

      if (!['provider', 'customer'].includes(String(subjectType))) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid subject type',
        });
        return;
      }

      const reviewer = await AppDataSource.getRepository(User).findOne({
        where: { id: String(reviewerUserId).trim() },
      });

      if (!reviewer || !['reviewer', 'admin', 'super_admin'].includes(reviewer.role)) {
        res.status(404).json({
          status: 'error',
          message: 'Reviewer account not found',
        });
        return;
      }

      const subject = await buildReviewSubjectSummary(
        String(subjectType) as ReviewSubjectType,
        String(subjectId)
      );

      if (!subject) {
        res.status(404).json({
          status: 'error',
          message: 'Review subject not found',
        });
        return;
      }

      const threadId = uuidv4();
      const metadata: ReviewThreadMetadata = {
        threadKind: 'review_assignment',
        threadId,
        adminUserId: req.user!.userId,
        reviewerUserId: reviewer.id,
        subjectType: String(subjectType) as ReviewSubjectType,
        subjectId: String(subjectId),
        subjectLabel: subject.label,
        subjectSecondaryLabel: subject.secondaryLabel || null,
        messageKind: 'message',
        decision: null,
      };

      const created = await createNotification({
        recipientUserId: reviewer.id,
        actorUserId: req.user!.userId,
        type: NotificationType.MESSAGE,
        title: `New review request: ${subject.label}`,
        body: String(body).trim(),
        link: getInboxLink(reviewer.role, threadId),
        metadataJson: metadata,
      });

      res.status(201).json({
        status: 'success',
        message: 'Review thread created successfully',
        data: {
          threadId,
          notificationId: created?.id || null,
          subject,
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create review thread',
      });
    }
  }
);

router.get(
  '/:threadId',
  authMiddleware,
  authorizeRole(...allowedRoles),
  async (req: Request, res: Response) => {
    try {
      const thread = await getThreadForUser(String(req.params.threadId), req.user!.userId);

      if (!thread) {
        res.status(404).json({
          status: 'error',
          message: 'Review thread not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        message: 'Review thread fetched successfully',
        data: thread,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch review thread',
      });
    }
  }
);

router.post(
  '/:threadId/messages',
  authMiddleware,
  authorizeRole(...allowedRoles),
  async (req: Request, res: Response) => {
    try {
      const threadId = String(req.params.threadId);
      const { body } = req.body;

      if (!body || !String(body).trim()) {
        res.status(400).json({
          status: 'error',
          message: 'Message body is required',
        });
        return;
      }

      const thread = await getThreadForUser(threadId, req.user!.userId);

      if (!thread) {
        res.status(404).json({
          status: 'error',
          message: 'Review thread not found',
        });
        return;
      }

      const recipientUserId =
        req.user!.userId === thread.metadata.adminUserId
          ? thread.metadata.reviewerUserId
          : thread.metadata.adminUserId;

      const recipient = await AppDataSource.getRepository(User).findOne({
        where: { id: recipientUserId },
      });

      if (!recipient) {
        res.status(404).json({
          status: 'error',
          message: 'Recipient not found',
        });
        return;
      }

      const metadata: ReviewThreadMetadata = {
        ...thread.metadata,
        messageKind: 'message',
        decision: null,
      };

      const created = await createNotification({
        recipientUserId,
        actorUserId: req.user!.userId,
        type: NotificationType.MESSAGE,
        title: `Review thread update: ${thread.subject.label}`,
        body: String(body).trim(),
        link: getInboxLink(recipient.role, threadId),
        metadataJson: metadata,
      });

      res.status(201).json({
        status: 'success',
        message: 'Review thread message sent successfully',
        data: {
          id: created?.id || null,
          body: String(body).trim(),
          createdAt: created?.createdAt || new Date(),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send review thread message',
      });
    }
  }
);

router.post(
  '/:threadId/read',
  authMiddleware,
  authorizeRole(...allowedRoles),
  async (req: Request, res: Response) => {
    try {
      const threadId = String(req.params.threadId);
      const thread = await getThreadForUser(threadId, req.user!.userId);

      if (!thread) {
        res.status(404).json({
          status: 'error',
          message: 'Review thread not found',
        });
        return;
      }

      await markReviewThreadAsRead(threadId, req.user!.userId);

      res.status(200).json({
        status: 'success',
        message: 'Review thread marked as read',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark review thread as read',
      });
    }
  }
);

router.post(
  '/:threadId/decision',
  authMiddleware,
  authorizeRole('reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const threadId = String(req.params.threadId);
      const { decision, note } = req.body;

      if (!Object.values(ModerationDecision).includes(decision as ModerationDecision)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid decision',
        });
        return;
      }

      const thread = await getThreadForUser(threadId, req.user!.userId);

      if (!thread) {
        res.status(404).json({
          status: 'error',
          message: 'Review thread not found',
        });
        return;
      }

      if (req.user!.userId !== thread.metadata.reviewerUserId) {
        res.status(403).json({
          status: 'error',
          message: 'Only the assigned reviewer can submit the decision',
        });
        return;
      }

      if (thread.metadata.subjectType === 'provider') {
        const updatedProvider = await saveModerationDecision({
          providerId: thread.metadata.subjectId,
          reviewerUserId: req.user!.userId,
          decision: decision as ModerationDecision,
          note: note ? String(note).trim() : null,
          checklistJson: null,
        });

        if (!updatedProvider) {
          res.status(404).json({
            status: 'error',
            message: 'Provider not found',
          });
          return;
        }
      }

      const adminUser = await AppDataSource.getRepository(User).findOne({
        where: { id: thread.metadata.adminUserId },
      });

      if (!adminUser) {
        res.status(404).json({
          status: 'error',
          message: 'Admin participant not found',
        });
        return;
      }

      const metadata: ReviewThreadMetadata = {
        ...thread.metadata,
        messageKind: 'decision',
        decision: decision as ModerationDecision,
      };

      const decisionLabel = String(decision).replace('_', ' ');
      const body = note?.trim()
        ? `Decision: ${decisionLabel}\n${String(note).trim()}`
        : `Decision: ${decisionLabel}`;

      const created = await createNotification({
        recipientUserId: thread.metadata.adminUserId,
        actorUserId: req.user!.userId,
        type: NotificationType.SYSTEM,
        title: `Review decision: ${thread.subject.label}`,
        body,
        link: getInboxLink(adminUser.role, threadId),
        metadataJson: metadata,
      });

      res.status(201).json({
        status: 'success',
        message: 'Decision posted to the review thread successfully',
        data: {
          id: created?.id || null,
          decision,
          note: note ? String(note).trim() : null,
          createdAt: created?.createdAt || new Date(),
        },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to post the review decision',
      });
    }
  }
);

export default router;