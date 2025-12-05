import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { couponsAPI, settingsAPI } from '../services/api';

export interface Coupon {
  id?: string;
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

// API'den gelen coupon formatı
interface APICoupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  description?: string;
  categories?: string[];
}

// API coupon'ı frontend formatına çevir
const mapAPICouponToCoupon = (apiCoupon: APICoupon): Coupon => ({
  id: apiCoupon.id,
  code: apiCoupon.code,
  type: apiCoupon.type.toLowerCase() as 'percentage' | 'fixed',
  value: apiCoupon.value,
  minPurchase: apiCoupon.minPurchase,
  maxDiscount: apiCoupon.maxDiscount,
  validUntil: new Date(apiCoupon.validUntil),
  usageLimit: apiCoupon.usageLimit,
  usedCount: apiCoupon.usedCount,
  description: apiCoupon.description || '',
  categories: apiCoupon.categories,
  isActive: apiCoupon.isActive,
});

interface CouponContextType {
  appliedCoupon: Coupon | null;
  availableCoupons: Coupon[];
  isLoading: boolean;
  applyCoupon: (code: string, cartTotal: number) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  calculateDiscount: (cartTotal: number) => number;
  giftWrap: boolean;
  setGiftWrap: (value: boolean) => void;
  giftMessage: string;
  setGiftMessage: (message: string) => void;
  giftWrapPrice: number;
  refreshCoupons: () => Promise<void>;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

// Fallback mock coupons
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
];

export const CouponProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>(mockCoupons);
  const [isLoading, setIsLoading] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftWrapPrice, setGiftWrapPrice] = useState(25);

  // Kuponları ve ayarları yükle
  const refreshCoupons = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Kuponları yükle
      const couponsResponse = await couponsAPI.getAll();
      if (couponsResponse.success && couponsResponse.data?.coupons) {
        const mappedCoupons = couponsResponse.data.coupons.map(mapAPICouponToCoupon);
        setAvailableCoupons(mappedCoupons);
      }
      
      // Gift wrap price ayarını yükle
      try {
        const settingsResponse = await settingsAPI.get('gift_wrap_price');
        if (settingsResponse.success && settingsResponse.data?.value) {
          setGiftWrapPrice(parseFloat(settingsResponse.data.value));
        }
      } catch {
        // Ayar bulunamazsa default değer kullan
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
      // Fallback to mock data
      setAvailableCoupons(mockCoupons);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // İlk yüklemede kuponları çek
  useEffect(() => {
    refreshCoupons();
  }, [refreshCoupons]);

  const applyCoupon = async (code: string, cartTotal: number): Promise<{ success: boolean; message: string }> => {
    try {
      // API'den doğrula
      const response = await couponsAPI.validate(code, cartTotal);
      
      if (response.success && response.data?.coupon) {
        const coupon = mapAPICouponToCoupon(response.data.coupon);
        setAppliedCoupon(coupon);
        return { success: true, message: `"${coupon.code}" kuponu uygulandı!` };
      } else {
        return { success: false, message: response.message || 'Kupon uygulanamadı' };
      }
    } catch (err: any) {
      // API hatası durumunda local validasyon yap
      const coupon = availableCoupons.find(c => c.code.toLowerCase() === code.toLowerCase());
      
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
    }
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
    
    return Math.min(discount, cartTotal);
  };

  return (
    <CouponContext.Provider value={{
      appliedCoupon,
      availableCoupons: availableCoupons.filter(c => c.isActive),
      isLoading,
      applyCoupon,
      removeCoupon,
      calculateDiscount,
      giftWrap,
      setGiftWrap,
      giftMessage,
      setGiftMessage,
      giftWrapPrice,
      refreshCoupons,
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
