import { z } from "zod";

import {
  learningSkillSchema,
  learningTrackSchema,
  metricBandSchema,
} from "./learning-assessment.schema";

export const exerciseDifficultySchema = z.number().int().min(1).max(5);

export const exerciseTypeSchema = z.enum([
  "fill_blank",
  "choose_precise_word",
  "correct_sentence",
  "join_ideas",
  "choose_best_response",
]);

const choiceSchema = z
  .string()
  .trim()
  .transform((choice) => choice.replace(/^[A-C]\s*[.)\-:]\s*/i, "").trim())
  .pipe(z.string().min(1).max(160));

export const adaptiveExerciseSchema = z
  .object({
    exerciseType: exerciseTypeSchema,
    prompt: z.string().trim().min(1).max(300),
    choices: z.array(choiceSchema).length(3),
    correctChoice: z.number().int().min(0).max(2),
    hint: z.string().trim().min(1).max(240),
    successMessage: z.string().trim().min(1).max(240),
    explanation: z.string().trim().min(1).max(300),
  })
  .superRefine((exercise, context) => {
    const normalisedChoices = exercise.choices.map((choice) =>
      choice.toLocaleLowerCase("en"),
    );

    if (new Set(normalisedChoices).size !== exercise.choices.length) {
      context.addIssue({
        code: "custom",
        message: "Exercise choices must be unique.",
        path: ["choices"],
      });
    }
  });

export const generatedAdaptiveExerciseOutputSchema = z.object({
  exerciseType: exerciseTypeSchema,
  prompt: z.string().trim().min(1).max(300),
  choices: z.array(choiceSchema).length(3),
  correctAnswer: choiceSchema,
  hint: z.string().trim().min(1).max(240),
  successMessage: z.string().trim().min(1).max(240),
  explanation: z.string().trim().min(1).max(300),
});

export const generatedAdaptiveExerciseSchema =
  generatedAdaptiveExerciseOutputSchema
    .superRefine((exercise, context) => {
      const normalisedChoices = exercise.choices.map(normaliseChoice);
      if (new Set(normalisedChoices).size !== exercise.choices.length) {
        context.addIssue({
          code: "custom",
          message: "Exercise choices must be unique.",
          path: ["choices"],
        });
      }

      if (
        !normalisedChoices.includes(normaliseChoice(exercise.correctAnswer))
      ) {
        context.addIssue({
          code: "custom",
          message: "The correct answer must exactly match one exercise choice.",
          path: ["correctAnswer"],
        });
      }
    })
    .transform(({ correctAnswer, ...exercise }) => ({
      ...exercise,
      correctChoice: exercise.choices.findIndex(
        (choice) => normaliseChoice(choice) === normaliseChoice(correctAnswer),
      ),
    }));

function normaliseChoice(choice: string) {
  return choice.toLocaleLowerCase("en").trim();
}

export const practiceAttemptSchema = z.object({
  prompt: z.string().trim().min(1).max(300),
  difficulty: exerciseDifficultySchema,
  selectedChoice: z.string().trim().min(1).max(160),
  wasCorrect: z.boolean(),
  hintUsed: z.boolean(),
});

export const generateAdaptiveExerciseRequestSchema = z.object({
  track: learningTrackSchema,
  skill: learningSkillSchema,
  skillLabel: z.string().trim().min(1).max(100),
  band: metricBandSchema,
  learnerEvidence: z.string().trim().min(1).max(500),
  observation: z.string().trim().min(1).max(500),
  difficulty: exerciseDifficultySchema,
  recentAttempts: z.array(practiceAttemptSchema).max(8),
  previousPrompts: z.array(z.string().trim().min(1).max(300)).max(8),
});

export type AdaptiveExercise = z.infer<typeof adaptiveExerciseSchema>;
export type ExerciseDifficulty = z.infer<typeof exerciseDifficultySchema>;
export type ExerciseType = z.infer<typeof exerciseTypeSchema>;
export type PracticeAttempt = z.infer<typeof practiceAttemptSchema>;
export type GenerateAdaptiveExerciseRequest = z.infer<
  typeof generateAdaptiveExerciseRequestSchema
>;
