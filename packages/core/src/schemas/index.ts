import { z } from "zod";

/**
 * Canonical User shape, validated at the edges of the app.
 * Keep in sync with packages/database/prisma/schema.prisma.
 */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(120).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = userSchema.pick({
  email: true,
  name: true,
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
