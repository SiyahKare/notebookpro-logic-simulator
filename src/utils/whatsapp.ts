/**
 * Generates a deep link for WhatsApp API.
 * 
 * @param phoneNumber - The destination phone number (with or without '+' or spaces).
 * @param message - Optional pre-filled message string.
 * @returns The fully formatted URL string.
 */
export const generateWhatsAppLink = (phoneNumber: string, message?: string): string => {
  // 1. Sanitize Phone Number
  // Remove all non-numeric characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');

  // 2. Base URL
  let url = `https://wa.me/${cleanNumber}`;

  // 3. Append Message if exists
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    url += `?text=${encodedMessage}`;
  }

  return url;
};