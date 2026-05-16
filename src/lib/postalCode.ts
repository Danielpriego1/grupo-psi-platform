export const POSTAL_CODE_REGEX = /^\d{5}$/;

/** Normalize pasted/typed input: strip non-digits, max 5 chars. */
export function normalizePostalCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 5);
}

/** True only when value matches exactly 5 digits. */
export function isValidPostalCode(value: string): boolean {
  return POSTAL_CODE_REGEX.test(value.trim());
}
