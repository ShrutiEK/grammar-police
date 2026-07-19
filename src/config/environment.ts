import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1).optional(),
  SARVAM_API_KEY: z.string().trim().min(1).optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    SARVAM_API_KEY: process.env.SARVAM_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
}
