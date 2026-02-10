import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Allow build to succeed without server env vars (they're validated at runtime)
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
