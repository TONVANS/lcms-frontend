import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('LCMS'),
  NEXT_PUBLIC_API_MODE: z.enum(['mock', 'live']).default('mock'),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1).default('http://localhost:3001/api'),
  NEXT_PUBLIC_MAX_UPLOAD_MB: z.coerce.number().positive().default(25),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return schema.parse({
    NEXT_PUBLIC_APP_NAME: raw.NEXT_PUBLIC_APP_NAME || undefined,
    NEXT_PUBLIC_API_MODE: raw.NEXT_PUBLIC_API_MODE || undefined,
    NEXT_PUBLIC_API_BASE_URL: raw.NEXT_PUBLIC_API_BASE_URL || undefined,
    NEXT_PUBLIC_MAX_UPLOAD_MB: raw.NEXT_PUBLIC_MAX_UPLOAD_MB || undefined,
  });
}

// Literal process.env.NEXT_PUBLIC_* expressions so Next.js can inline them.
export const env: Env = parseEnv({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_MAX_UPLOAD_MB: process.env.NEXT_PUBLIC_MAX_UPLOAD_MB,
});
