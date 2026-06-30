/**
 * Shared password policy — pure, no Node/env imports so BOTH the server-side Zod
 * schema and the client form can use the exact same rules. A strong password
 * must be at least 8 chars and contain an uppercase letter, a lowercase letter,
 * a number, and a special character.
 */

export const MIN_PASSWORD_LENGTH = 8;

/** Single source of truth for the "is this strong enough" check. */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,200}$/;

export const PASSWORD_HINT =
  "Use 8+ characters with an uppercase letter, a lowercase letter, a number, and a special character.";

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

/** The individual rules — rendered as a live checklist on the signup/reset form. */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: `At least ${MIN_PASSWORD_LENGTH} characters`, test: (v) => v.length >= MIN_PASSWORD_LENGTH },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /\d/.test(v) },
  { id: "special", label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function isStrongPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value);
}
