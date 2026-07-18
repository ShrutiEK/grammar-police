import { z } from "zod";

export const learnerAssessmentSchema = z.object({
  grammar_score: z.number().min(0).max(100),
  vocabulary_score: z.number().min(0).max(100),
  communication_score: z.number().min(0).max(100),
  pronunciation_score: z.number().min(0).max(100),
  grammatical_errors: z.array(z.string().trim()),
  vocabulary_errors: z.array(z.string().trim()),
  mastered_skills: z.array(z.string().trim()),
  child_friendly_feedback: z.string().trim().min(1),
});
