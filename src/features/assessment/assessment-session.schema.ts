import { z } from "zod";

import {
  learnerAssessmentSchema,
  questionTypeSchema,
} from "./assessment.schema";

export const pictureFilenameSchema = z.enum([
  "beach.png",
  "classroom.png",
  "market.png",
  "picnic.png",
  "railway.png",
]);

export const conversationTurnSchema = z.object({
  audioDurationInSeconds: z.number().positive().max(600).nullable().optional(),
  number: z.number().int().min(1).max(8),
  question: z.string().trim().min(1),
  answer: z.string().trim().min(1).nullable(),
  answerMode: z.enum(["spoken", "written"]).nullable(),
  assessment: learnerAssessmentSchema.nullable(),
  questionType: questionTypeSchema.optional(),
});

export const previousPictureSessionSchema = z.object({
  selectedPictureFilename: pictureFilenameSchema,
  focusTopic: z.string().trim().min(1).nullable(),
  questionsAndAnswers: z.array(conversationTurnSchema).min(1).max(8),
});

export const assessmentSessionSchema = z.object({
  selectedPictureFilename: pictureFilenameSchema,
  focusTopic: z.string().trim().min(1).nullable(),
  questionsAndAnswers: z.array(conversationTurnSchema).min(1).max(8),
  previousPictureSessions: z
    .array(previousPictureSessionSchema)
    .max(4)
    .optional(),
  viewedPictureFilenames: z.array(pictureFilenameSchema).max(5).optional(),
});

export type AssessmentSession = z.infer<typeof assessmentSessionSchema>;
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export type PreviousPictureSession = z.infer<
  typeof previousPictureSessionSchema
>;
