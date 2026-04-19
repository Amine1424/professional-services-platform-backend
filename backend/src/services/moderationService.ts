import { AppDataSource } from '../config/database';
import AppNotification, { NotificationType } from '../models/AppNotification';
import ProviderModerationReview, {
  ModerationDecision,
} from '../models/ProviderModerationReview';
import ServiceProvider, { ProviderStatus } from '../models/ServiceProvider';
import User from '../models/User';
import { createNotification } from './notificationService';

export type ReviewSubjectType = 'provider' | 'customer';

export interface ReviewThreadMetadata extends Record<string, unknown> {
  threadKind: 'review_assignment';
  threadId: string;
  adminUserId: string;
  reviewerUserId: string;
  subjectType: ReviewSubjectType;
  subjectId: string;
  subjectLabel: string;
  subjectSecondaryLabel?: string | null;
  messageKind?: 'message' | 'decision' | 'system';
  decision?: ModerationDecision | null;
}

type AppNotificationWithReviewThreadMetadata = AppNotification & {
  metadataJson: ReviewThreadMetadata;
};

export const getProviderStatusFromDecision = (
  decision: ModerationDecision
): ProviderStatus => {
  switch (decision) {
    case ModerationDecision.APPROVED:
      return ProviderStatus.APPROVED;
    case ModerationDecision.REJECTED:
      return ProviderStatus.REJECTED;
    case ModerationDecision.SUSPENDED:
      return ProviderStatus.SUSPENDED;
    case ModerationDecision.REQUEST_INFO:
    default:
      return ProviderStatus.PENDING;
  }
};

export const saveModerationDecision = async ({
  providerId,
  reviewerUserId,
  decision,
  note,
  checklistJson,
}: {
  providerId: string;
  reviewerUserId: string;
  decision: ModerationDecision;
  note?: string | null;
  checklistJson?: Record<string, boolean> | null;
}) => {
  const providerRepository = AppDataSource.getRepository(ServiceProvider);
  const moderationRepository = AppDataSource.getRepository(ProviderModerationReview);

  const provider = await providerRepository.findOne({
    where: { id: providerId },
    relations: ['user', 'primaryCategory'],
  });

  if (!provider) {
    return null;
  }

  provider.status = getProviderStatusFromDecision(decision);
  provider.isVerified = decision === ModerationDecision.APPROVED;
  await providerRepository.save(provider);

  const moderationReview = moderationRepository.create({
    providerId,
    reviewerUserId,
    decision,
    note: note || null,
    checklistJson: checklistJson || null,
  });

  await moderationRepository.save(moderationReview);

  await createNotification({
    recipientUserId: provider.userId,
    actorUserId: reviewerUserId,
    type: NotificationType.SYSTEM,
    title: 'Provider review updated',
    body: `Your account review status is now ${provider.status}.`,
    link: '/provider/dashboard',
    metadataJson: {
      providerId: provider.id,
      decision,
      status: provider.status,
      isVerified: provider.isVerified,
    },
  });

  return provider;
};

export const buildReviewSubjectSummary = async (
  subjectType: ReviewSubjectType,
  subjectId: string
) => {
  if (subjectType === 'provider') {
    const provider = await AppDataSource.getRepository(ServiceProvider).findOne({
      where: { id: subjectId },
      relations: ['user', 'primaryCategory'],
    });

    if (!provider) {
      return null;
    }

    return {
      type: 'provider' as const,
      id: provider.id,
      label: provider.companyName,
      secondaryLabel: provider.user?.email || null,
      profile: {
        id: provider.id,
        companyName: provider.companyName,
        description: provider.description,
        city: provider.city,
        wilaya: provider.wilaya,
        region: provider.region,
        status: provider.status,
        isVerified: provider.isVerified,
        yearsOfExperience: provider.yearsOfExperience,
        owner: provider.user
          ? {
              id: provider.user.id,
              firstName: provider.user.firstName,
              lastName: provider.user.lastName,
              email: provider.user.email,
            }
          : null,
        primaryCategory: provider.primaryCategory
          ? {
              id: provider.primaryCategory.id,
              name: provider.primaryCategory.name,
            }
          : null,
      },
    };
  }

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: subjectId },
  });

  if (!user) {
    return null;
  }

  return {
    type: 'customer' as const,
    id: user.id,
    label: `${user.firstName} ${user.lastName}`.trim() || user.email,
    secondaryLabel: user.email,
    profile: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || null,
      role: user.role,
      isActive: user.isActive,
    },
  };
};

export const isReviewThreadMetadata = (
  value: unknown
): value is ReviewThreadMetadata => {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as ReviewThreadMetadata).threadKind === 'review_assignment' &&
      typeof (value as ReviewThreadMetadata).threadId === 'string' &&
      typeof (value as ReviewThreadMetadata).adminUserId === 'string' &&
      typeof (value as ReviewThreadMetadata).reviewerUserId === 'string' &&
      ((value as ReviewThreadMetadata).subjectType === 'provider' ||
        (value as ReviewThreadMetadata).subjectType === 'customer') &&
      typeof (value as ReviewThreadMetadata).subjectId === 'string' &&
      typeof (value as ReviewThreadMetadata).subjectLabel === 'string'
  );
};

const hasReviewThreadMetadata = (
  notification: AppNotification
): notification is AppNotificationWithReviewThreadMetadata => {
  return isReviewThreadMetadata(notification.metadataJson);
};

export const getReviewThreadNotificationsForUser = async (userId: string) => {
  const notifications = await AppDataSource.getRepository(AppNotification).find({
    where: [{ recipientUserId: userId }, { actorUserId: userId }],
    order: { createdAt: 'ASC' },
  });

  return notifications.filter(hasReviewThreadMetadata);
};

export const getReviewThreadListForUser = async (userId: string) => {
  const notifications = await getReviewThreadNotificationsForUser(userId);
  const threads = new Map<
    string,
    {
      metadata: ReviewThreadMetadata;
      lastMessage: AppNotification;
      unreadCount: number;
    }
  >();

  notifications.forEach((notification) => {
    const metadata = notification.metadataJson;
    const existing = threads.get(metadata.threadId);
    const unreadIncrement =
      notification.recipientUserId === userId && !notification.isRead ? 1 : 0;

    if (!existing) {
      threads.set(metadata.threadId, {
        metadata,
        lastMessage: notification,
        unreadCount: unreadIncrement,
      });
      return;
    }

    existing.unreadCount += unreadIncrement;
    if (
      new Date(notification.createdAt).getTime() >=
      new Date(existing.lastMessage.createdAt).getTime()
    ) {
      existing.lastMessage = notification;
      existing.metadata = metadata;
    }
  });

  const threadItems = await Promise.all(
    Array.from(threads.values()).map(async (thread) => {
      const subject = await buildReviewSubjectSummary(
        thread.metadata.subjectType,
        thread.metadata.subjectId
      );

      return {
        threadId: thread.metadata.threadId,
        metadata: thread.metadata,
        lastMessage: thread.lastMessage,
        unreadCount: thread.unreadCount,
        subject,
      };
    })
  );

  return threadItems
    .filter((item) => item.subject)
    .sort(
      (left, right) =>
        new Date(right.lastMessage.createdAt).getTime() -
        new Date(left.lastMessage.createdAt).getTime()
    );
};

export const markReviewThreadAsRead = async (threadId: string, userId: string) => {
  const repo = AppDataSource.getRepository(AppNotification);
  const notifications = await repo.find({
    where: { recipientUserId: userId },
    order: { createdAt: 'ASC' },
  });

  const unreadItems = notifications.filter((notification) => {
    if (notification.isRead) {
      return false;
    }

    const metadata = notification.metadataJson;
    return isReviewThreadMetadata(metadata) && metadata.threadId === threadId;
  });

  if (!unreadItems.length) {
    return;
  }

  const now = new Date();

  for (const item of unreadItems) {
    item.isRead = true;
    item.readAt = now;
  }

  await repo.save(unreadItems);
};