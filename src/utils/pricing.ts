import { Product, User, UserRole, PricingResult } from '../types/index';

const VAT_RATE = 0.20; // 20% KDV

/**
 * Applies psychological pricing strategy.
 * Policy: Round up to the nearest 10 TL, then subtract 0.10.
 * Example: 
 *  341.20 -> 350.00 -> 349.90
 *  12.50 -> 20.00 -> 19.90
 * 
 * @param rawPrice The calculated exact price
 * @returns The psychological price
 */
export const applyPsychologicalPricing = (rawPrice: number): number => {
  // 1. Ceiling to nearest integer
  const ceiled = Math.ceil(rawPrice);
  
  // 2. Find next multiple of 10
  // If number is 341, ceiled is 341. Next 10 is 350.
  // If number is 349, ceiled is 349. Next 10 is 350.
  const nextTen = Math.ceil(ceiled / 10) * 10;

  // 3. Subtract 10 cents to get .90 ending
  return parseFloat((nextTen - 0.10).toFixed(2));
};

/**
 * Main Pricing Engine
 * Determines the final price based on User Role, Product Settings, and Exchange Rate.
 */
export const calculateProductPrice = (
  product: Product,
  user: User | null,
  exchangeRate: number
): PricingResult => {
  
  // 1. Determine Base Price (USD)
  let basePriceUSD = product.price_usd;
  
  // 2. Check for Dealer Discount
  let appliedDiscountPercent = 0;
  
  if (user && user.role === UserRole.DEALER && user.is_approved) {
    appliedDiscountPercent = product.dealer_discount_percent;
  }

  const discountAmount = basePriceUSD * (appliedDiscountPercent / 100);
  const discountedPriceUSD = basePriceUSD - discountAmount;

  // 3. Convert to Local Currency (TL) - Subtotal
  const subtotalTL = discountedPriceUSD * exchangeRate;

  // 4. Add VAT (KDV)
  const vatAmountTL = subtotalTL * VAT_RATE;
  
  // 5. Raw Total (Mathematically correct total)
  const rawTotalTL = subtotalTL + vatAmountTL;

  // 6. Apply Pricing Policy (Psychological)
  const finalPriceTL = applyPsychologicalPricing(rawTotalTL);

  return {
    basePriceUSD,
    appliedDiscountPercent,
    discountedPriceUSD,
    exchangeRate,
    subtotalTL,
    vatAmountTL,
    rawTotalTL,
    finalPriceTL
  };
};

/**
 * Helper to format currency for UI
 */
export const formatCurrency = (amount: number, currency: string = '₺'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
};