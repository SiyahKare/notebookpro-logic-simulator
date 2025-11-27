
/**
 * Luhn Algorithm for Credit Card Validation
 * Checks if the card number is mathematically valid.
 */
export const isValidLuhn = (cardNumber: string): boolean => {
  const cleanNum = cardNumber.replace(/\D/g, '');
  if (cleanNum.length < 13) return false;

  let sum = 0;
  let shouldDouble = false;

  // Loop through values starting from the rightmost digit
  for (let i = cleanNum.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNum.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

/**
 * Detects Card Type based on regex patterns (BIN ranges)
 */
export const getCardType = (cardNumber: string): 'visa' | 'mastercard' | 'troy' | 'amex' | 'unknown' => {
  const cleanNum = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(cleanNum)) return 'visa';
  if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
  if (/^9792/.test(cleanNum)) return 'troy'; // Turkey Troy Card
  if (/^3[47]/.test(cleanNum)) return 'amex';
  
  return 'unknown';
};

/**
 * Formats card number into groups of 4
 */
export const formatCardNumber = (value: string): string => {
  const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  const matches = v.match(/\d{4,16}/g);
  const match = (matches && matches[0]) || '';
  const parts = [];

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4));
  }

  if (parts.length) {
    return parts.join(' ');
  } else {
    return value;
  }
};

/**
 * Formats expiry date to MM/YY
 */
export const formatExpiry = (value: string): string => {
  const clean = value.replace(/\D/g, '');
  if (clean.length >= 3) {
    return `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
  }
  return clean;
};
