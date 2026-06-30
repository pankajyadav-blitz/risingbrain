import type { z } from "zod";
import type { userSchema } from "../schemas";

export type User = z.infer<typeof userSchema>;

/** Discriminated result type for service / API responses. */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Nullable<T> = T | null;
