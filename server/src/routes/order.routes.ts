import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly, staffOnly } from '../middlewares/auth.js';
import { emailService } from '../services/email.service.js';

const router = Router();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// ===================
// GET /api/orders (Admin: all, User: own)
// ===================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  
  // Non-admins can only see their own orders
  if (req.user!.role !== 'ADMIN') {
    where.userId = req.user!.id;
  }

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { name: true, imageUrl: true, sku: true }
            }
          }
        },
        user: {
          select: { name: true, email: true }
        },
        address: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.order.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      orders,
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
// GET /api/orders/:id
// ===================
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true
        }
      },
      user: {
        select: { name: true, email: true, phone: true }
      },
      address: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!order) {
    throw new AppError('Sipariş bulunamadı', 404);
  }

  // Check authorization
  if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.id) {
    throw new AppError('Bu siparişi görüntüleme yetkiniz yok', 403);
  }

  res.json({
    success: true,
    data: order
  });
}));

// ===================
// POST /api/orders
// ===================
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const {
    items,
    addressId,
    couponCode,
    isGiftWrapped = false,
    giftMessage,
    customerNote,
    paymentMethod
  } = req.body;

  if (!items || items.length === 0) {
    throw new AppError('Sepet boş olamaz', 400);
  }

  // Get products and validate stock
  const productIds = items.map((item: any) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  });

  if (products.length !== productIds.length) {
    throw new AppError('Bazı ürünler bulunamadı', 400);
  }

  // Check stock and calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    if (product.stock < item.quantity) {
      throw new AppError(`${product.name} için yeterli stok yok`, 400);
    }

    const unitPrice = product.priceUsd * 35; // USD to TRY conversion
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice
    });
  }

  // Apply coupon
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (coupon && coupon.isActive && coupon.validUntil > new Date()) {
      if (!coupon.minPurchase || subtotal >= coupon.minPurchase) {
        if (coupon.type === 'PERCENTAGE') {
          couponDiscount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount) {
            couponDiscount = Math.min(couponDiscount, coupon.maxDiscount);
          }
        } else {
          couponDiscount = coupon.value;
        }
        // Increment usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    }
  }

  // Calculate VAT and total
  const vatAmount = subtotal * 0.20;
  const shippingCost = subtotal > 500 ? 0 : 50; // Free shipping over 500 TL
  const giftWrapCost = isGiftWrapped ? 25 : 0;
  const totalAmount = subtotal + vatAmount + shippingCost + giftWrapCost - couponDiscount;

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: req.user!.id,
      addressId,
      subtotal,
      vatAmount,
      discount: couponDiscount,
      shippingCost,
      totalAmount: totalAmount + giftWrapCost,
      couponCode,
      couponDiscount,
      isGiftWrapped,
      giftMessage,
      customerNote,
      paymentMethod,
      items: {
        create: orderItems
      },
      statusHistory: {
        create: {
          status: 'PENDING',
          note: 'Sipariş oluşturuldu',
          createdBy: req.user!.name
        }
      }
    },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  // Decrease stock
  for (const item of orderItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    });

    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'OUT',
        quantity: item.quantity,
        reason: `Sipariş: ${order.orderNumber}`,
        performedBy: 'System'
      }
    });
  }

  // Create notification
  await prisma.notification.create({
    data: {
      userId: req.user!.id,
      type: 'ORDER',
      title: 'Siparişiniz Alındı',
      message: `${order.orderNumber} numaralı siparişiniz başarıyla oluşturuldu.`,
      link: `/orders/${order.id}`
    }
  });

  // Send order confirmation email
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (user?.email) {
    emailService.sendOrderConfirmation(user.email, {
      orderNumber: order.orderNumber,
      customerName: user.name,
      items: orderItems.map(item => ({
        name: item.productName || 'Ürün',
        quantity: item.quantity,
        price: item.totalPrice,
      })),
      subtotal: order.subtotal,
      shipping: order.shippingCost,
      total: order.totalAmount,
      address: address ? `${address.address}, ${address.district}/${address.city}` : undefined,
    }).catch(err => console.error('Failed to send order email:', err));
  }

  res.status(201).json({
    success: true,
    message: 'Sipariş başarıyla oluşturuldu',
    data: order
  });
}));

// ===================
// PATCH /api/orders/:id/status (Admin only)
// ===================
router.patch('/:id/status', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, trackingNumber, carrier } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new AppError('Sipariş bulunamadı', 404);
  }

  const updateData: any = { status };

  // Handle shipping info
  if (status === 'SHIPPED') {
    if (!trackingNumber || !carrier) {
      throw new AppError('Kargo bilgileri zorunludur', 400);
    }
    updateData.trackingNumber = trackingNumber;
    updateData.carrier = carrier;
    updateData.shippedAt = new Date();
  }

  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: updateData
  });

  // Add status history
  await prisma.orderStatusHistory.create({
    data: {
      orderId: id,
      status,
      note,
      createdBy: req.user!.name
    }
  });

  // Create notification for user
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Siparişiniz onaylandı',
    PREPARING: 'Siparişiniz hazırlanıyor',
    SHIPPED: `Siparişiniz kargoya verildi. Takip: ${trackingNumber}`,
    DELIVERED: 'Siparişiniz teslim edildi',
    CANCELLED: 'Siparişiniz iptal edildi'
  };

  if (statusMessages[status]) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: 'ORDER',
        title: statusMessages[status],
        message: `${order.orderNumber} numaralı sipariş: ${statusMessages[status]}`,
        link: `/orders/${order.id}`
      }
    });
  }

  // Send shipping notification email
  if (status === 'SHIPPED' && trackingNumber) {
    const user = await prisma.user.findUnique({ where: { id: order.userId } });
    if (user?.email) {
      emailService.sendShippingNotification(user.email, {
        orderNumber: order.orderNumber,
        customerName: user.name,
        trackingNumber,
        carrier: carrier || 'Kargo',
      }).catch(err => console.error('Failed to send shipping email:', err));
    }
  }

  res.json({
    success: true,
    message: 'Sipariş durumu güncellendi',
    data: updatedOrder
  });
}));

// ===================
// POST /api/orders/:id/cancel
// ===================
router.post('/:id/cancel', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    throw new AppError('Sipariş bulunamadı', 404);
  }

  // Check authorization
  if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.id) {
    throw new AppError('Bu siparişi iptal etme yetkiniz yok', 403);
  }

  // Check if cancellable
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new AppError('Bu sipariş artık iptal edilemez', 400);
  }

  // Restore stock
  for (const item of order.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } }
    });

    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'IN',
        quantity: item.quantity,
        reason: `Sipariş iptali: ${order.orderNumber}`,
        performedBy: req.user!.name
      }
    });
  }

  // Update order
  await prisma.order.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });

  await prisma.orderStatusHistory.create({
    data: {
      orderId: id,
      status: 'CANCELLED',
      note: reason || 'Müşteri tarafından iptal edildi',
      createdBy: req.user!.name
    }
  });

  res.json({
    success: true,
    message: 'Sipariş iptal edildi'
  });
}));

export default router;

