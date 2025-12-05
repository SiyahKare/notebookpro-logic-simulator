import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, optionalAuth, adminOnly, staffOnly } from '../middlewares/auth.js';

const router = Router();

// Generate tracking code
const generateTrackingCode = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NB-${year}-${random}`;
};

// ===================
// GET /api/repairs (Staff: all, User: own)
// ===================
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { status, priority, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  
  // Non-staff can only see their own repairs
  if (!['ADMIN', 'TECHNICIAN'].includes(req.user!.role)) {
    where.userId = req.user!.id;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [repairs, total] = await Promise.all([
    prisma.repair.findMany({
      where,
      include: {
        parts: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.repair.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      repairs,
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
// GET /api/repairs/track/:code (Public)
// ===================
router.get('/track/:code', asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const repair = await prisma.repair.findUnique({
    where: { trackingCode: code.toUpperCase() },
    include: {
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!repair) {
    throw new AppError('Servis kaydı bulunamadı', 404);
  }

  // Return limited info for public tracking
  res.json({
    success: true,
    data: {
      trackingCode: repair.trackingCode,
      deviceBrand: repair.deviceBrand,
      deviceModel: repair.deviceModel,
      status: repair.status,
      priority: repair.priority,
      issueDescription: repair.issueDescription,
      estimatedCost: repair.estimatedCost,
      finalCost: repair.finalCost,
      receivedAt: repair.receivedAt,
      statusHistory: repair.statusHistory.map(h => ({
        status: h.status,
        note: h.note,
        createdAt: h.createdAt
      }))
    }
  });
}));

// ===================
// GET /api/repairs/:id
// ===================
router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const repair = await prisma.repair.findUnique({
    where: { id },
    include: {
      parts: {
        include: { product: true }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' }
      },
      user: {
        select: { name: true, email: true, phone: true }
      }
    }
  });

  if (!repair) {
    throw new AppError('Servis kaydı bulunamadı', 404);
  }

  // Check authorization
  if (!['ADMIN', 'TECHNICIAN'].includes(req.user!.role) && repair.userId !== req.user!.id) {
    throw new AppError('Bu kaydı görüntüleme yetkiniz yok', 403);
  }

  res.json({
    success: true,
    data: repair
  });
}));

// ===================
// POST /api/repairs
// ===================
router.post('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    deviceBrand,
    deviceModel,
    serialNumber,
    issueDescription,
    priority = 'NORMAL'
  } = req.body;

  // Validate required fields
  if (!customerName || !customerPhone || !deviceBrand || !deviceModel || !issueDescription) {
    throw new AppError('Müşteri adı, telefon, cihaz bilgisi ve arıza açıklaması zorunludur', 400);
  }

  const repair = await prisma.repair.create({
    data: {
      trackingCode: generateTrackingCode(),
      userId: req.user?.id,
      customerName,
      customerPhone,
      customerEmail,
      deviceBrand,
      deviceModel,
      serialNumber,
      issueDescription,
      priority,
      statusHistory: {
        create: {
          status: 'RECEIVED',
          note: 'Cihaz teslim alındı',
          createdBy: req.user?.name || 'Sistem'
        }
      }
    }
  });

  // Create notification if user is logged in
  if (req.user) {
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'REPAIR',
        title: 'Servis Kaydı Oluşturuldu',
        message: `${repair.trackingCode} takip kodlu servis kaydınız oluşturuldu.`,
        link: `/service/${repair.trackingCode}`
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Servis kaydı oluşturuldu',
    data: {
      id: repair.id,
      trackingCode: repair.trackingCode
    }
  });
}));

// ===================
// PATCH /api/repairs/:id/status (Staff only)
// ===================
router.patch('/:id/status', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, estimatedCost, finalCost, technicianNotes, warrantyStatus, warrantyNotes } = req.body;

  const repair = await prisma.repair.findUnique({ where: { id } });
  if (!repair) {
    throw new AppError('Servis kaydı bulunamadı', 404);
  }

  const updateData: any = { status };

  if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
  if (finalCost !== undefined) updateData.finalCost = finalCost;
  if (technicianNotes) updateData.technicianNotes = technicianNotes;
  if (warrantyStatus) updateData.warrantyStatus = warrantyStatus;
  if (warrantyNotes) updateData.warrantyNotes = warrantyNotes;

  // Set timestamps based on status
  if (status === 'DIAGNOSING' && !repair.diagnosedAt) {
    updateData.diagnosedAt = new Date();
  }
  if (status === 'READY') {
    updateData.repairedAt = new Date();
  }
  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }

  // Assign technician if not assigned
  if (!repair.technicianId && req.user!.role === 'TECHNICIAN') {
    updateData.technicianId = req.user!.id;
  }

  const updatedRepair = await prisma.repair.update({
    where: { id },
    data: updateData
  });

  // Add status history
  await prisma.repairStatusHistory.create({
    data: {
      repairId: id,
      status,
      note,
      createdBy: req.user!.name
    }
  });

  // Create notification if user exists
  if (repair.userId) {
    const statusMessages: Record<string, string> = {
      DIAGNOSING: 'Cihazınız inceleniyor',
      WAITING_PARTS: 'Parça bekleniyor',
      WAITING_APPROVAL: 'Onayınız bekleniyor',
      IN_REPAIR: 'Tamir işlemi başladı',
      QUALITY_CHECK: 'Kalite kontrol aşamasında',
      READY: 'Cihazınız hazır, teslim alabilirsiniz',
      DELIVERED: 'Cihazınız teslim edildi'
    };

    if (statusMessages[status]) {
      await prisma.notification.create({
        data: {
          userId: repair.userId,
          type: 'REPAIR',
          title: statusMessages[status],
          message: `${repair.trackingCode}: ${statusMessages[status]}`,
          link: `/service/${repair.trackingCode}`
        }
      });
    }
  }

  res.json({
    success: true,
    message: 'Servis durumu güncellendi',
    data: updatedRepair
  });
}));

// ===================
// POST /api/repairs/:id/parts (Staff only)
// ===================
router.post('/:id/parts', authenticate, staffOnly, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { productId, quantity } = req.body;

  const repair = await prisma.repair.findUnique({ where: { id } });
  if (!repair) {
    throw new AppError('Servis kaydı bulunamadı', 404);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Ürün bulunamadı', 404);
  }

  if (product.stock < quantity) {
    throw new AppError('Yeterli stok yok', 400);
  }

  // Add part to repair
  const part = await prisma.repairPart.create({
    data: {
      repairId: id,
      productId,
      quantity,
      unitPrice: product.priceUsd * 35
    }
  });

  // Decrease stock
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });

  await prisma.stockMovement.create({
    data: {
      productId,
      type: 'OUT',
      quantity,
      reason: `Servis: ${repair.trackingCode}`,
      performedBy: req.user!.name
    }
  });

  res.status(201).json({
    success: true,
    message: 'Parça eklendi',
    data: part
  });
}));

export default router;

