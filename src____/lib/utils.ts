// src/lib/utils.ts

/**
 * Formats a Nigerian phone number to the +234XXXXXXXXX format.
 * Handles various input formats like 080XXXXXXXX, 234XXXXXXXX, +234XXXXXXXX.
 * @param input - The raw phone number string.
 * @returns The formatted phone number string in +234XXXXXXXXX format.
 */
export const formatPhoneNumber = (input: string): string => {
 
  const digitsOnly = input.replace(/\D/g, "");

  
  if (digitsOnly.startsWith("0")) {
    return `+234${digitsOnly.slice(1)}`;
  }

  
  if (digitsOnly.startsWith("234")) {
    return `+${digitsOnly}`;
  }

  
  if (digitsOnly.startsWith("+234")) {
    return digitsOnly;
  }

  
  if (digitsOnly.length === 11 && /^[789]\d{9}$/.test(digitsOnly)) {
     return `+234${digitsOnly.slice(1)}`;
  }

  
  console.warn(`Phone number format not recognized: ${input}. Returning as is.`);
  return digitsOnly;
};