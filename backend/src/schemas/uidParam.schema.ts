import { z } from 'zod';

export const uidParamSchema = z.object({
  uid: z
    .string()
    .min(1, 'User ID is required')
    .max(128, 'User ID is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format'),
});

export type UidParamInput = z.infer<typeof uidParamSchema>;
