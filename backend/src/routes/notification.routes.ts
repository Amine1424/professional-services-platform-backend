import { Request, Response, Router } from 'express';
import { AppDataSource } from '../config/database';
import { authMiddleware, authorizeRole } from '../middleware/auth';
import AppNotification from '../models/AppNotification';

const router = Router();

router.get(
  '/me',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AppNotification);

      const items = await repo.find({
        where: { recipientUserId: req.user!.userId },
        order: { createdAt: 'DESC' },
        take: 50,
      });

      res.status(200).json({
        status: 'success',
        message: 'Notifications fetched successfully',
        data: items,
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch notifications',
      });
    }
  }
);

router.get(
  '/unread-count',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AppNotification);

      const count = await repo.count({
        where: {
          recipientUserId: req.user!.userId,
          isRead: false,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Unread notifications count fetched successfully',
        data: { count },
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch unread notifications count',
      });
    }
  }
);

router.post(
  '/:id/read',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id);
      const repo = AppDataSource.getRepository(AppNotification);

      const notification = await repo.findOne({
        where: {
          id,
          recipientUserId: req.user!.userId,
        },
      });

      if (!notification) {
        res.status(404).json({
          status: 'error',
          message: 'Notification not found',
        });
        return;
      }

      notification.isRead = true;
      notification.readAt = new Date();

      await repo.save(notification);

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark notification as read',
      });
    }
  }
);

router.post(
  '/read-all',
  authMiddleware,
  authorizeRole('customer', 'service_provider', 'reviewer', 'admin', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AppNotification);

      await repo
        .createQueryBuilder()
        .update(AppNotification)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where('recipient_user_id = :recipientUserId', {
          recipientUserId: req.user!.userId,
        })
        .andWhere('is_read = :isRead', { isRead: false })
        .execute();

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch {
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark all notifications as read',
      });
    }
  }
);

export default router;