import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  SARVAM_API_KEY: z.string().trim().min(1),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function readServerEnvironment(): ServerEnvironment {
  return serverEnvironmentSchema.parse({
    SARVAM_API_KEY: process.env.SARVAM_API_KEY,
  });
}
