import { z } from "zod";

import { learnerAssessmentSchema } from "./assessment.schema";

export const completedAssessmentResponseSchema = z.object({
  assessment: learnerAssessmentSchema,
  transcript: z.string().trim().min(1),
});

export type AssessmentResult = z.infer<
  typeof completedAssessmentResponseSchema
>;

export const pendingTranscriptionResponseSchema = z.object({
  jobId: z.string().trim().min(1),
  status: z.literal("processing"),
});

export type PendingTranscriptionResult = z.infer<
  typeof pendingTranscriptionResponseSchema
>;

export const studentAssessmentResponseSchema = z.union([
  completedAssessmentResponseSchema,
  pendingTranscriptionResponseSchema,
]);
