import { z } from "zod";

import {
  learningSkillSchema,
  learningTrackSchema,
  metricBandSchema,
} from "./learning-assessment.schema";

export const lessonRoundSchema = z.object({
  id: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  choices: z.array(z.string().trim().min(1)).length(3),
  correctChoice: z.number().int().min(0).max(2),
  successMessage: z.string().trim().min(1),
  hint: z.string().trim().min(1),
});

export const personalisedLessonSchema = z.object({
  missionTitle: z.string().trim().min(1),
  track: learningTrackSchema,
  skill: learningSkillSchema,
  skillLabel: z.string().trim().min(1),
  reason: z.string().trim().min(1),
  learnerEvidence: z.string().trim().min(1),
  observation: z.string().trim().min(1),
  startingBand: metricBandSchema,
  teachingTip: z.string().trim().min(1),
  example: z.string().trim().min(1),
  rounds: z.array(lessonRoundSchema).length(3),
  successCriteria: z.string().trim().min(1),
});

export type PersonalisedLesson = z.infer<typeof personalisedLessonSchema>;
