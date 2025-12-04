// src/lib/utils.ts

/**
 * Formats a Nigerian phone number to the +234XXXXXXXXX format.
 * Handles various input formats like 080XXXXXXXX, 234XXXXXXXX, +234XXXXXXXX.
 * @param input - The raw phone number string.
 * @returns The formatted phone number string in +234XXXXXXXXX format.
 */
export const formatPhoneNumber = (input: string): string => {
  // Remove any non-digit characters (like spaces, dashes, parentheses, +)
  const digitsOnly = input.replace(/\D/g, "");

  // If it starts with '0', remove the '0' and prepend '+234'
  if (digitsOnly.startsWith("0")) {
    return `+234${digitsOnly.slice(1)}`;
  }

  // If it starts with '234', prepend '+'
  if (digitsOnly.startsWith("234")) {
    return `+${digitsOnly}`;
  }

  // If it already starts with '+234', return as is
  if (digitsOnly.startsWith("+234")) {
    return digitsOnly;
  }

  // If it's a bare number without a country code, and it looks like a Nigerian number (11 digits starting with 8 or 7)
  // This is a common format in Nigeria: 080XXXXXXXX -> 11 digits
  if (digitsOnly.length === 11 && /^[789]\d{9}$/.test(digitsOnly)) {
     return `+234${digitsOnly.slice(1)}`;
  }

  // If none of the above patterns match, return as is (might cause API error)
  // Or you could throw an error if you prefer stricter validation
  console.warn(`Phone number format not recognized: ${input}. Returning as is.`);
  return digitsOnly;
};