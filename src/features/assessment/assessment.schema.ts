import { z } from "zod";

const cefrLevelSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

const scoredDimensionSchema = z.object({
  score: z.number().min(0).max(100),
  evidence: z.string().trim().min(1),
});

export const learnerAssessmentSchema = z.object({
  cefrLevel: cefrLevelSchema,
  vocabulary: scoredDimensionSchema,
  grammar: scoredDimensionSchema,
  sentenceComplexity: scoredDimensionSchema,
  fluencyScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  pronunciationConfidence: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string().trim().min(1)).min(1),
  learningGaps: z.array(z.string().trim().min(1)).min(1),
  recommendedNextLesson: z.string().trim().min(1),
});
