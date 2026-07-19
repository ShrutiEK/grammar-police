import { z } from "zod";

/**
 * The existing domain schemas carry no timestamp, so the hybrid sync layer wraps
 * each payload in an envelope. `updatedAt` (epoch-ms) drives last-write-wins
 * reconciliation between the localStorage mirror and Redis; `data` is the
 * unchanged, schema-validated payload.
 */
export type SyncEnvelope<T> = {
  updatedAt: number;
  data: T;
};

export function envelopeSchema<T>(dataSchema: z.ZodType<T>) {
  return z.object({
    updatedAt: z.number().int().positive(),
    data: dataSchema,
  });
}
