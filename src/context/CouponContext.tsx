import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  description: string;
  categories?: string[];
  isActive: boolean;
}

interface CouponContextType {
  appliedCoupon: Coupon | null;
  availableCoupons: Coupon[];
  applyCoupon: (code: string, cartTotal: number) => { success: boolean; message: string };
  removeCoupon: () => void;
  calculateDiscount: (cartTotal: number) => number;
  giftWrap: boolean;
  setGiftWrap: (value: boolean) => void;
  giftMessage: string;
  setGiftMessage: (message: string) => void;
  giftWrapPrice: number;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

// Mock coupon data
const mockCoupons: Coupon[] = [
  {
    code: 'HOSGELDIN10',
    type: 'percentage',
    value: 10,
    minPurchase: 500,
    maxDiscount: 200,
    validUntil: new Date('2025-12-31'),
    usageLimit: 1000,
    usedCount: 450,
    description: 'İlk siparişinize %10 indirim',
    isActive: true
  },
  {
    code: 'YILBASI100',
    type: 'fixed',
    value: 100,
    minPurchase: 1000,
    validUntil: new Date('2025-01-15'),
    usageLimit: 500,
    usedCount: 123,
    description: 'Yılbaşına özel 100₺ indirim',
    isActive: true
  },
  {
    code: 'EKRAN15',
    type: 'percentage',
    value: 15,
    minPurchase: 0,
    maxDiscount: 500,
    validUntil: new Date('2025-06-30'),
    usedCount: 89,
    description: 'Ekran ürünlerinde %15 indirim',
    categories: ['SCREEN'],
    isActive: true
  },
  {
    code: 'UCRETSIZ50',
    type: 'fixed',
    value: 50,
    minPurchase: 500,
    validUntil: new Date('2025-03-31'),
    usedCount: 234,
    description: 'Ücretsiz kargo yerine 50₺ indirim',
    isActive: true
  },
  {
    code: 'VIP20',
    type: 'percentage',
    value: 20,
    minPurchase: 2000,
    maxDiscount: 1000,
    validUntil: new Date('2025-12-31'),
    usedCount: 45,
    description: 'VIP müşterilere özel %20 indirim',
    isActive: true
  }
];

export const CouponProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const giftWrapPrice = 25; // 25 TL

  const applyCoupon = (code: string, cartTotal: number): { success: boolean; message: string } => {
    const coupon = mockCoupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    
    if (!coupon) {
      return { success: false, message: 'Geçersiz kupon kodu' };
    }
    
    if (!coupon.isActive) {
      return { success: false, message: 'Bu kupon aktif değil' };
    }
    
    if (new Date() > coupon.validUntil) {
      return { success: false, message: 'Bu kuponun süresi dolmuş' };
    }
    
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, message: 'Bu kuponun kullanım limiti dolmuş' };
    }
    
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      return { 
        success: false, 
        message: `Minimum ${coupon.minPurchase}₺ alışveriş gerekli` 
      };
    }
    
    setAppliedCoupon(coupon);
    return { success: true, message: `"${coupon.code}" kuponu uygulandı!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const calculateDiscount = (cartTotal: number): number => {
    if (!appliedCoupon) return 0;
    
    let discount = 0;
    
    if (appliedCoupon.type === 'percentage') {
      discount = (cartTotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else {
      discount = appliedCoupon.value;
    }
    
    return Math.min(discount, cartTotal); // Can't exceed cart total
  };

  return (
    <CouponContext.Provider value={{
      appliedCoupon,
      availableCoupons: mockCoupons.filter(c => c.isActive),
      applyCoupon,
      removeCoupon,
      calculateDiscount,
      giftWrap,
      setGiftWrap,
      giftMessage,
      setGiftMessage,
      giftWrapPrice
    }}>
      {children}
    </CouponContext.Provider>
  );
};

export const useCoupon = () => {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error('useCoupon must be used within a CouponProvider');
  }
  return context;
};

export default CouponContext;

