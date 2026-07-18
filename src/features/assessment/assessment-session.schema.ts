import { z } from "zod";

import { completedAssessmentResponseSchema } from "./assessment-response.schema";

export const assessmentSessionSchema = z.object({
  progress: z.number().min(0).max(100),
  stars: z.number().min(0),
  lastResult: completedAssessmentResponseSchema.nullable(),
});

export type AssessmentSession = z.infer<typeof assessmentSessionSchema>;
