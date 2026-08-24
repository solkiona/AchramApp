// src/lib/validation/validateName.ts

export interface NameValidationResult {
  valid: boolean;
  error: string | null;
}

const BLOCKED_PATTERNS = [
  /^(test|demo|fake|admin|user|abc|xyz|qwerty|asdf|zxcv)/i,
  /^(.)\1{2,}$/,          // "AAA", "BBB"
  /^(123|000|111|999)/,   // numeric spam
  /^(mr|mrs|ms|dr|prof)\s*$/i, // title only
];

const SPECIAL_CHARS_ALLOWED = /[^a-zA-Z\s'-]/;
const HAS_NUMBER = /\d/;

export function validateFullName(name: string): NameValidationResult {
  const trimmed = name.trim();

  // 1. Required
  if (!trimmed) {
    return { valid: false, error: 'Full name is required.' };
  }

  // 2. Length boundaries
  if (trimmed.length < 3) {
    return { valid: false, error: 'Name is too short.' };
  }
  if (trimmed.length > 60) {
    return { valid: false, error: 'Name is too long.' };
  }

  // 3. No numbers
  if (HAS_NUMBER.test(trimmed)) {
    return { valid: false, error: 'Name must not contain numbers.' };
  }

  // 4. No special characters (only letters, spaces, hyphens, apostrophes)
  if (SPECIAL_CHARS_ALLOWED.test(trimmed)) {
    return { valid: false, error: 'Name contains invalid characters.' };
  }

  // 5. Must have at least two words (first + last name)
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) {
    return { valid: false, error: 'Please enter your full name (first and last).' };
  }

  // 6. Each word must be at least 2 characters
  for (const word of words) {
    if (word.length < 2) {
      return { valid: false, error: 'Each part of the name must be at least 2 characters.' };
    }
  }

  // 7. No ALL-CAPS names longer than 3 characters (catches "HVVDJ", "ASDFGH")
  const alphaOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (alphaOnly.length > 3 && alphaOnly === alphaOnly.toUpperCase()) {
    return { valid: false, error: 'Please use proper capitalization for your name.' };
  }

  // 8. No repeated single characters (e.g., "AAAA", "BBB CCC")
  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, '');
    if (clean.length >= 3 && new RegExp(`^(.)\\1{${clean.length - 1}}$`).test(clean)) {
      return { valid: false, error: 'Name appears to be invalid.' };
    }
  }

  // 9. Block known spam patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Please enter a valid name.' };
    }
  }

  // 10. At least one word must contain a lowercase letter (catches "AB CD")
  const hasLowercase = words.some(w => /[a-z]/.test(w));
  if (!hasLowercase && alphaOnly.length > 4) {
    return { valid: false, error: 'Please use proper capitalization for your name.' };
  }

  return { valid: true, error: null };
}