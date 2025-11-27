
/**
 * Converts USD to TL with "Psychological Pricing" strategy.
 * Formula: (USD * Rate * 1.VAT) -> Round Up to nearest 10 -> Subtract 0.10
 * Example: 10 USD * 35 Rate = 350 TL -> 350 TL -> 349.90 TL (Visual appeal)
 */
export const convertCurrency = (priceUsd: number, rate: number = 35.00): number => {
  if (!priceUsd || priceUsd < 0) return 0;

  const rawTl = priceUsd * rate;
  
  // Psychological Pricing Logic
  // 1. Ceiling to integer
  const ceiled = Math.ceil(rawTl);
  // 2. Round to next 10 (e.g., 342 -> 350)
  const nextTen = Math.ceil(ceiled / 10) * 10;
  // 3. Apply .90 effect (e.g., 349.90)
  // Note: If you want pure mathematical conversion, remove this block.
  // This simulates a retail strategy.
  const finalPrice = nextTen - 0.10;

  return parseFloat(finalPrice.toFixed(2));
};

/**
 * Calculates 20% VAT (KDV)
 */
export const calculateTax = (amount: number): number => {
  return amount * 0.20;
};

/**
 * Generates a simulated QR Code link for repair tracking.
 * In a real app, this would return a blob or data URL of an actual QR image.
 */
export const generateRepairQRLink = (trackingCode: string): string => {
  const baseUrl = "https://api.qrserver.com/v1/create-qr-code/";
  const data = encodeURIComponent(`https://notebookpro.com/track/${trackingCode}`);
  return `${baseUrl}?size=150x150&data=${data}`;
};

/**
 * Formats a number as Turkish Lira currency string
 */
export const formatTRCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(amount);
};
