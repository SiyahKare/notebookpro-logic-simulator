import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';

const router = Router();

// GET /api/users (Admin only)
router.get('/', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { role, isApproved, search, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (role) where.role = role;
  if (isApproved !== undefined) where.isApproved = isApproved === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { email: { contains: search as string } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, name: true, phone: true, role: true,
        isApproved: true, isActive: true, companyTitle: true,
        createdAt: true, lastLoginAt: true,
        _count: { select: { orders: true, repairs: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limitNum
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    success: true,
    data: { users, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } }
  });
}));

// PATCH /api/users/:id (Admin only)
router.patch('/:id', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('Kullanici bulunamadi', 404);

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updates,
    select: { id: true, email: true, name: true, role: true, isApproved: true, isActive: true }
  });

  res.json({ success: true, data: updatedUser });
}));

// GET /api/users/me/favorites
router.get('/me/favorites', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: favorites.map(f => f.product) });
}));

// Address routes
router.get('/me/addresses', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  });
  res.json({ success: true, data: addresses });
}));

router.post('/me/addresses', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { title, fullName, phone, city, district, address, postalCode, isDefault } = req.body;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } });
  }

  const newAddress = await prisma.address.create({
    data: { userId: req.user!.id, title, fullName, phone, city, district, address, postalCode, isDefault }
  });

  res.status(201).json({ success: true, data: newAddress });
}));

export default router;

