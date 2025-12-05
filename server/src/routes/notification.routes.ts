import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { unreadOnly, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { userId: req.user!.id };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip, take: limitNum
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user!.id, isRead: false } })
  ]);

  res.json({
    success: true,
    data: {
      notifications, unreadCount,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    }
  });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: req.user!.id }
  });

  if (!notification) throw new AppError('Bildirim bulunamadi', 404);

  await prisma.notification.update({ where: { id }, data: { isRead: true } });

  res.json({ success: true });
}));

// POST /api/notifications/read-all
router.post('/read-all', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true }
  });

  res.json({ success: true, message: 'Tum bildirimler okundu' });
}));

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.notification.deleteMany({
    where: { id, userId: req.user!.id }
  });

  res.json({ success: true });
}));

export default router;

