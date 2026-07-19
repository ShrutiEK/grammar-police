import { z } from "zod";

export const assessmentScoresSchema = z.object({
  vocabulary: z.number().min(1).max(5),
  grammar: z.number().min(1).max(5),
  reasoning: z.number().min(1).max(5),
  sentenceComplexity: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
});

export const learnerAssessmentSchema = z.object({
  scores: assessmentScoresSchema,
  feedback: z.string().trim().min(1),
  languageWarning: z.boolean(),
  languageHint: z.string().trim(),
  isGrounded: z.boolean(),
  isRelevantToFocus: z.boolean(),
  focusTopic: z.string().trim(),
  nextQuestion: z.string().trim().min(1),
});

export type AssessmentScores = z.infer<typeof assessmentScoresSchema>;
export type LearnerAssessment = z.infer<typeof learnerAssessmentSchema>;
