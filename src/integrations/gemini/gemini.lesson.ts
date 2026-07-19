import "server-only";

import { z } from "zod";

import {
  generatedAdaptiveExerciseOutputSchema,
  type GenerateAdaptiveExerciseRequest,
} from "@/features/lesson/adaptive-exercise.schema";
import { parseExerciseForRequest } from "@/features/lesson/adaptive-exercise-quality";
import { retryInvalidExercise } from "@/features/lesson/retry-invalid-exercise";
import { createAdaptiveExercisePrompt } from "@/prompts/lesson/create-adaptive-exercise-prompt";

import { createGeminiInteraction } from "./gemini.client";

const geminiExerciseModel = "gemini-3.5-flash";

export async function generateAdaptiveExerciseWithGemini(
  input: GenerateAdaptiveExerciseRequest,
) {
  return retryInvalidExercise(
    async (attempt, validationFeedback) => {
      const schema = z.toJSONSchema(generatedAdaptiveExerciseOutputSchema);
      const responseSchema = { ...schema };
      delete responseSchema.$schema;
      const interaction = await createGeminiInteraction({
        model: geminiExerciseModel,
        prompt: `${createAdaptiveExercisePrompt(input)}\n\n${createAttemptInstruction(input, attempt, validationFeedback)}`,
        responseSchema,
      });

      if (!interaction.output_text) {
        throw new Error("Gemini returned no lesson exercise.");
      }

      return JSON.parse(interaction.output_text) as unknown;
    },
    (candidate) => parseExerciseForRequest(candidate, input),
  );
}

function createAttemptInstruction(
  input: GenerateAdaptiveExerciseRequest,
  attempt: number,
  validationFeedback?: string,
) {
  if (attempt === 1) {
    return `Create difficulty ${input.difficulty} practice for ${input.skillLabel}.`;
  }

  return `Regenerate the exercise and fix every validation problem: ${validationFeedback ?? "invalid response"}. Recheck the answer and explanation before returning it.`;
}
