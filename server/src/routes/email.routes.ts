import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';
import { emailService } from '../services/email.service.js';

const router = Router();

// ===================
// POST /api/email/test (Admin only)
// Test email sending
// ===================
router.post('/test', authenticate, adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { type = 'welcome', email } = req.body;
  
  if (!email) {
    throw new AppError('E-posta adresi gerekli', 400);
  }

  let success = false;
  
  switch (type) {
    case 'welcome':
      success = await emailService.sendWelcomeEmail(email, 'Test Kullanıcı');
      break;
    
    case 'order':
      success = await emailService.sendOrderConfirmation(email, {
        orderNumber: 'TEST-ORDER-001',
        customerName: 'Test Müşteri',
        items: [
          { name: '15.6" FHD IPS Ekran', quantity: 1, price: 2450 },
          { name: 'Dell 60Wh Batarya', quantity: 1, price: 1275 },
        ],
        subtotal: 3725,
        shipping: 0,
        total: 3725,
        address: 'Test Adres, Kadıköy/İstanbul',
      });
      break;
    
    case 'shipping':
      success = await emailService.sendShippingNotification(email, {
        orderNumber: 'TEST-ORDER-001',
        customerName: 'Test Müşteri',
        trackingNumber: '123456789012',
        carrier: 'Yurtiçi Kargo',
      });
      break;
    
    case 'repair':
      success = await emailService.sendRepairStatusUpdate(email, {
        trackingCode: 'NB-TEST-0001',
        customerName: 'Test Müşteri',
        deviceInfo: 'Asus ROG Strix G15',
        status: 'DIAGNOSING',
        statusMessage: 'Cihazınız inceleniyor',
      });
      break;
    
    default:
      throw new AppError('Geçersiz e-posta tipi', 400);
  }

  res.json({
    success,
    message: success ? 'Test e-postası gönderildi' : 'E-posta gönderilemedi',
    data: { type, email }
  });
}));

export default router;

