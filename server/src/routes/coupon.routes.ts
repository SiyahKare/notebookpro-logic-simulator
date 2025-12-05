import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';

const router = Router();

// POST /api/coupons/validate
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { code, cartTotal } = req.body;

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon) throw new AppError('Gecersiz kupon kodu', 404);
  if (!coupon.isActive) throw new AppError('Bu kupon aktif degil', 400);
  if (coupon.validUntil < new Date()) throw new AppError('Kupon suresi dolmus', 400);
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new AppError('Kupon limiti dolmus', 400);
  if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
    throw new AppError(`Minimum ${coupon.minPurchase} TL alisveris gerekli`, 400);
  }

  let discount = 0;
  if (coupon.type === 'PERCENTAGE') {
    discount = (cartTotal * coupon.value) / 100;
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  } else {
    discount = coupon.value;
  }

  res.json({
    success: true,
    data: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.min(discount, cartTotal),
      description: coupon.description
    }
  });
}));

// GET /api/coupons (Admin only)
router.get('/', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: coupons });
}));

// POST /api/coupons (Admin only)
router.post('/', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { code, type, value, minPurchase, maxDiscount, usageLimit, validUntil, description, categories } = req.body;

  if (!code || !type || value === undefined || !validUntil) {
    throw new AppError('Kod, tip, deger ve gecerlilik tarihi zorunludur', 400);
  }

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) throw new AppError('Bu kod zaten kullaniliyor', 400);

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      type, value, minPurchase, maxDiscount, usageLimit,
      validUntil: new Date(validUntil),
      description,
      categories: categories ? JSON.stringify(categories) : null
    }
  });

  res.status(201).json({ success: true, data: coupon });
}));

// DELETE /api/coupons/:id (Admin only)
router.delete('/:id', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

export default router;

