/** Zod schemas for auth request bodies. */
import { z } from "zod";
import { PASSWORD_REGEX, PASSWORD_HINT } from "./password-policy";

const emailField = z.string().trim().toLowerCase().email("Enter a valid email");
const strongPassword = z
  .string()
  .max(200, "Password is too long")
  .regex(PASSWORD_REGEX, PASSWORD_HINT);

/** A 6-digit one-time code (string of exactly 6 digits). */
const otpCode = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");

/** Step 1 of signup: collect + validate the account details (no DB write yet). */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailField,
  password: strongPassword,
});

/** Step 2 of signup: verify the emailed OTP and finalize the account. */
export const verifyEmailSchema = z.object({
  email: emailField,
  code: otpCode,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
  /**
   * "Remember me": when true, auth cookies persist on disk (survive a browser
   * restart) up to the server-side session TTL. When false/omitted, they're
   * session cookies that the browser drops on close.
   */
  remember: z.boolean().optional().default(false),
});

/** Forgot-password step 1: request a reset code for an email. */
export const forgotPasswordSchema = z.object({ email: emailField });

/** Forgot-password step 2: verify the emailed OTP. */
export const verifyResetSchema = z.object({
  email: emailField,
  code: otpCode,
});

/** Forgot-password step 3: set a new password with the one-time reset token. */
export const resetPasswordSchema = z.object({
  email: emailField,
  token: z.string().trim().min(1, "Reset token is required"),
  password: strongPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
