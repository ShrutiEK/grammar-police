import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  SARVAM_API_KEY: z.string().trim().min(1).optional(),
  // Durable learner-data store (Upstash Redis, HTTP client — serverless-safe).
  UPSTASH_REDIS_REST_URL: z.string().trim().min(1).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1).optional(),
  // End-of-day snapshot store (MongoDB Atlas).
  MONGODB_URI: z.string().trim().min(1).optional(),
  MONGODB_DB: z.string().trim().min(1).optional(),
  // Shared secret Vercel Cron attaches as `Authorization: Bearer` on the EOD job.
  CRON_SECRET: z.string().trim().min(1).optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    SARVAM_API_KEY: process.env.SARVAM_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB,
    CRON_SECRET: process.env.CRON_SECRET,
  });
}
