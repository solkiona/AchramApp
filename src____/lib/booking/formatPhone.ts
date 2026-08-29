export const formatPhoneNumber = (input: string): string => {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.startsWith("0")) {
    return `+234${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.startsWith("234")) {
    return `+${digitsOnly}`;
  }
  if (digitsOnly.startsWith("+")) {
    return digitsOnly;
  }
  if (digitsOnly.length === 11) {
    return `+234${digitsOnly.slice(1)}`;
  }
  return digitsOnly;
};