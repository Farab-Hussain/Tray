import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email(),
    accountType: z.enum(['student', 'consultant', 'hiring_manager']),
    name: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
