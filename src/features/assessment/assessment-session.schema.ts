import { z } from "zod";

import { learnerAssessmentSchema } from "./assessment.schema";

export const pictureFilenameSchema = z.enum([
  "beach.png",
  "classroom.png",
  "market.png",
  "picnic.png",
  "railway.png",
]);

export const conversationTurnSchema = z.object({
  number: z.number().int().min(1).max(8),
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1).nullable(),
  answerMode: z.enum(["spoken", "written"]).nullable(),
  assessment: learnerAssessmentSchema.nullable(),
});

export const assessmentSessionSchema = z.object({
  selectedPictureFilename: pictureFilenameSchema,
  focusTopic: z.string().trim().min(1).nullable(),
  status: z.enum(["in_progress", "completed"]),
  questionsAndAnswers: z.array(conversationTurnSchema).min(1).max(8),
});

export type AssessmentSession = z.infer<typeof assessmentSessionSchema>;
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
