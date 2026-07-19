import { z } from "zod";

export const questionTypeSchema = z.enum([
  "picture_follow_up",
  "personal_follow_up",
]);

export type QuestionType = z.infer<typeof questionTypeSchema>;

export const learnerAssessmentSchema = z.object({
  languageWarning: z.boolean(),
  languageHint: z.string().trim(),
  isGrounded: z.boolean(),
  // True only when the learner answers the active question and stays on its locked topic.
  isRelevantToFocus: z.boolean(),
  focusTopic: z.string().trim(),
  nextQuestion: z.string().trim().min(1),
  nextQuestionType: questionTypeSchema,
});

export type LearnerAssessment = z.infer<typeof learnerAssessmentSchema>;
