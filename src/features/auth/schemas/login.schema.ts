import { z } from 'zod';
import { lo } from '@/lib/i18n/lo';

export const loginSchema = z.object({
  username: z.string().trim().min(1, lo.validation.usernameRequired),
  password: z.string().min(1, lo.validation.passwordRequired),
  remember: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
