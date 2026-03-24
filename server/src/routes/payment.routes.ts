import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import { authenticate } from '../middlewares/auth.js';
import iyzipay from '../config/iyzipay.js';

const router = Router();

// ===================
// POST /api/payment/charge
// ===================
router.post('/charge', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const {
    cardHolderName,
    cardNumber,
    expireMonth,
    expireYear,
    cvc,
    price,
    items,     // Optional, fallback to generic
    buyerInfo, // Optional, fallback to generic
    addressInfo// Optional, fallback to generic
  } = req.body;

  if (!cardNumber || !expireMonth || !expireYear || !cvc || !price) {
    throw new AppError('Eksik ödeme bilgisi', 400);
  }

  // Create standard Iyzico request structure
  const requestBody = {
    locale: 'tr',
    conversationId: Date.now().toString(),
    price: price.toString(),
    paidPrice: price.toString(),
    currency: 'TRY',
    installment: '1',
    basketId: 'B' + Date.now(),
    paymentChannel: 'WEB',
    paymentGroup: 'PRODUCT',
    paymentCard: {
      cardHolderName: cardHolderName || 'Test User',
      cardNumber: cardNumber.replace(/\s+/g, ''),
      expireMonth,
      expireYear,
      cvc,
      registerCard: '0'
    },
    buyer: {
      id: req.user!.id || 'BY789',
      name: buyerInfo?.name || req.user!.name || 'John',
      surname: buyerInfo?.surname || 'Doe',
      gsmNumber: buyerInfo?.phone || '+905320000000',
      email: req.user!.email || 'email@email.com',
      identityNumber: '74300864791',
      lastLoginDate: '2024-01-01 15:12:09',
      registrationDate: '2023-01-01 15:12:09',
      registrationAddress: addressInfo?.address || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
      ip: req.ip || '85.34.78.112',
      city: addressInfo?.city || 'Istanbul',
      country: 'Turkey',
      zipCode: '34732'
    },
    shippingAddress: {
      contactName: buyerInfo?.name || 'John Doe',
      city: addressInfo?.city || 'Istanbul',
      country: 'Turkey',
      address: addressInfo?.address || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
      zipCode: '34732'
    },
    billingAddress: {
      contactName: buyerInfo?.name || 'John Doe',
      city: addressInfo?.city || 'Istanbul',
      country: 'Turkey',
      address: addressInfo?.address || 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
      zipCode: '34732'
    },
    basketItems: items?.length > 0 ? items.map((item: any) => ({
      id: item.id || 'BI101',
      name: item.name || 'Bilgisayar Parçası',
      category1: 'Elektronik',
      category2: 'Bilgisayar',
      itemType: 'PHYSICAL',
      price: (item.price || price).toString()
    })) : [
      {
        id: 'BI101',
        name: 'Sepet Toplamı',
        category1: 'Elektronik',
        itemType: 'PHYSICAL',
        price: price.toString()
      }
    ]
  };

  // Convert callback API to Promise
  const result: any = await new Promise((resolve, reject) => {
    iyzipay.payment.create(requestBody as any, (err: any, res: any) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  if (result.status === 'failure') {
    throw new AppError(result.errorMessage || 'Ödeme işlemi başarısız oldu.', 400);
  }

  res.status(200).json({
    success: true,
    message: 'Ödeme başarıyla tamamlandı',
    data: result
  });
}));

export default router;
