import { AppDataSource } from '../config/database';
import AppNotification, { NotificationType } from '../models/AppNotification';

interface CreateNotificationInput {
  recipientUserId: string;
  actorUserId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  metadataJson?: Record<string, unknown> | null;
  allowSelfNotify?: boolean;
}

export const createNotification = async ({
  recipientUserId,
  actorUserId = null,
  type,
  title,
  body,
  link = null,
  metadataJson = null,
  allowSelfNotify = false,
}: CreateNotificationInput) => {
  if (!allowSelfNotify && actorUserId && actorUserId === recipientUserId) {
    return null;
  }

  const repo = AppDataSource.getRepository(AppNotification);

  const notification = repo.create({
    recipientUserId,
    actorUserId,
    type,
    title,
    body,
    link,
    metadataJson,
    isRead: false,
    readAt: null,
  });

  return await repo.save(notification);
};

export const createManyNotifications = async (
  items: CreateNotificationInput[]
) => {
  const results = await Promise.all(items.map((item) => createNotification(item)));
  return results.filter(Boolean);
};