import { z } from "zod";

import { learnerAssessmentSchema } from "./assessment.schema";

export const completedAssessmentResponseSchema = z.object({
  assessment: learnerAssessmentSchema,
  transcript: z.string().trim().min(1),
});

export type AssessmentResult = z.infer<
  typeof completedAssessmentResponseSchema
>;
