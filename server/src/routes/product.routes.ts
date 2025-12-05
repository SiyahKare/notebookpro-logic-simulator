import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, optionalAuth, adminOnly, staffOnly } from '../middlewares/auth.js';

const router = Router();

// ===================
// GET /api/products
// ===================
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { 
    category, 
    search, 
    minPrice, 
    maxPrice, 
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = '1',
    limit = '20'
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = { isActive: true };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { sku: { contains: search as string } },
      { description: { contains: search as string } }
    ];
  }

  if (minPrice || maxPrice) {
    where.priceUsd = {};
    if (minPrice) where.priceUsd.gte = parseFloat(minPrice as string);
    if (maxPrice) where.priceUsd.lte = parseFloat(maxPrice as string);
  }

  if (inStock === 'true') {
    where.stock = { gt: 0 };
  }

  // Get products
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        compatibleModels: true,
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { [sortBy as string]: sortOrder },
      skip,
      take: limitNum
    }),
    prisma.product.count({ where })
  ]);

  // Calculate average ratings
  const productsWithRating = products.map(product => {
    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;
    
    return {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product._count.reviews,
      reviews: undefined,
      _count: undefined
    };
  });

  res.json({
    success: true,
    data: {
      products: productsWithRating,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }
  });
}));

// ===================
// GET /api/products/:id
// ===================
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      compatibleModels: true,
      reviews: {
        include: {
          user: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  // Calculate average rating
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  // Check if favorited by user
  let isFavorited = false;
  if (req.user) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: id
        }
      }
    });
    isFavorited = !!favorite;
  }

  res.json({
    success: true,
    data: {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      isFavorited
    }
  });
}));

// ===================
// POST /api/products (Admin only)
// ===================
router.post('/', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const {
    sku,
    name,
    description,
    category,
    priceUsd,
    vatRate = 0.20,
    stock = 0,
    criticalLimit = 5,
    dealerDiscountPercent = 0,
    shelfLocation,
    imageUrl,
    compatibleModels = []
  } = req.body;

  // Validate required fields
  if (!sku || !name || !category || !priceUsd) {
    throw new AppError('SKU, isim, kategori ve fiyat zorunludur', 400);
  }

  // Check if SKU exists
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    throw new AppError('Bu SKU zaten kullanılıyor', 400);
  }

  const product = await prisma.product.create({
    data: {
      sku,
      name,
      description,
      category,
      priceUsd: parseFloat(priceUsd),
      vatRate: parseFloat(vatRate),
      stock: parseInt(stock, 10),
      criticalLimit: parseInt(criticalLimit, 10),
      dealerDiscountPercent: parseFloat(dealerDiscountPercent),
      shelfLocation,
      imageUrl,
      compatibleModels: {
        create: compatibleModels.map((model: string) => ({ modelName: model }))
      }
    },
    include: { compatibleModels: true }
  });

  // Create stock movement for initial stock
  if (stock > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: 'IN',
        quantity: stock,
        reason: 'İlk stok girişi',
        performedBy: req.user!.name
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Ürün başarıyla oluşturuldu',
    data: product
  });
}));

// ===================
// PUT /api/products/:id (Admin only)
// ===================
router.put('/:id', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  // Handle stock changes
  if (updates.stock !== undefined && updates.stock !== existing.stock) {
    const difference = updates.stock - existing.stock;
    await prisma.stockMovement.create({
      data: {
        productId: id,
        type: difference > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(difference),
        reason: 'Manuel stok düzeltmesi',
        performedBy: req.user!.name
      }
    });
  }

  // Handle compatible models update
  if (updates.compatibleModels) {
    await prisma.compatibleModel.deleteMany({ where: { productId: id } });
    await prisma.compatibleModel.createMany({
      data: updates.compatibleModels.map((model: string) => ({
        productId: id,
        modelName: model
      }))
    });
    delete updates.compatibleModels;
  }

  const product = await prisma.product.update({
    where: { id },
    data: updates,
    include: { compatibleModels: true }
  });

  res.json({
    success: true,
    message: 'Ürün güncellendi',
    data: product
  });
}));

// ===================
// DELETE /api/products/:id (Admin only)
// ===================
router.delete('/:id', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  // Soft delete
  await prisma.product.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Ürün silindi'
  });
}));

// ===================
// POST /api/products/:id/stock (Staff only)
// ===================
router.post('/:id/stock', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, quantity, reason } = req.body;

  if (!type || !quantity) {
    throw new AppError('Hareket tipi ve miktar zorunludur', 400);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  const qty = parseInt(quantity, 10);
  const newStock = type === 'IN' 
    ? product.stock + qty 
    : type === 'OUT' 
      ? product.stock - qty 
      : qty; // ADJUSTMENT sets directly

  if (newStock < 0) {
    throw new AppError('Stok negatif olamaz', 400);
  }

  // Create movement and update stock
  await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: id,
        type,
        quantity: type === 'ADJUSTMENT' ? Math.abs(product.stock - qty) : qty,
        reason,
        performedBy: req.user!.name
      }
    }),
    prisma.product.update({
      where: { id },
      data: { stock: newStock }
    })
  ]);

  res.json({
    success: true,
    message: 'Stok hareketi kaydedildi',
    data: { newStock }
  });
}));

// ===================
// GET /api/products/:id/stock-history
// ===================
router.get('/:id/stock-history', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.json({
    success: true,
    data: movements
  });
}));

// ===================
// POST /api/products/:id/favorite
// ===================
router.post('/:id/favorite', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_productId: {
        userId: req.user!.id,
        productId: id
      }
    }
  });

  if (existing) {
    // Remove from favorites
    await prisma.favorite.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Favorilerden kaldırıldı', isFavorited: false });
  } else {
    // Add to favorites
    await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        productId: id
      }
    });
    res.json({ success: true, message: 'Favorilere eklendi', isFavorited: true });
  }
}));

// ===================
// POST /api/products/:id/review
// ===================
router.post('/:id/review', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Geçerli bir puan girin (1-5)', 400);
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  // Check if user already reviewed
  const existing = await prisma.review.findUnique({
    where: {
      productId_userId: {
        productId: id,
        userId: req.user!.id
      }
    }
  });

  if (existing) {
    // Update existing review
    const review = await prisma.review.update({
      where: { id: existing.id },
      data: { rating, comment }
    });
    res.json({ success: true, message: 'Yorum güncellendi', data: review });
  } else {
    // Create new review
    const review = await prisma.review.create({
      data: {
        productId: id,
        userId: req.user!.id,
        rating,
        comment
      }
    });
    res.status(201).json({ success: true, message: 'Yorum eklendi', data: review });
  }
}));

export default router;

