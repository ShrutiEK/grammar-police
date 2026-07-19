import "server-only";

import { z } from "zod";

import {
  generatedAdaptiveExerciseOutputSchema,
  type GenerateAdaptiveExerciseRequest,
} from "@/features/lesson/adaptive-exercise.schema";
import { parseExerciseForRequest } from "@/features/lesson/adaptive-exercise-quality";
import { retryInvalidExercise } from "@/features/lesson/retry-invalid-exercise";
import { createAdaptiveExercisePrompt } from "@/prompts/lesson/create-adaptive-exercise-prompt";

import { requestOpenAi } from "./openai.client";
import { parseOpenAiResponseOutput } from "./openai.responses";

const adaptiveExerciseModel = "gpt-5.6-terra";

export async function generateAdaptiveExerciseWithOpenAi(
  input: GenerateAdaptiveExerciseRequest,
) {
  return retryInvalidExercise(
    async (attempt, validationFeedback) => {
      const response = await requestOpenAi("/v1/responses", {
        body: JSON.stringify({
          input: [
            {
              role: "system",
              content: createAdaptiveExercisePrompt(input),
            },
            {
              role: "user",
              content:
                attempt === 1
                  ? `Create difficulty ${input.difficulty} practice for ${input.skillLabel}.`
                  : `Regenerate the exercise and fix every validation problem: ${validationFeedback ?? "invalid response"}. Recheck the answer and explanation before returning it.`,
            },
          ],
          model: adaptiveExerciseModel,
          reasoning: { effort: "none" },
          store: false,
          text: {
            format: {
              type: "json_schema",
              name: "adaptive_english_exercise",
              schema: z.toJSONSchema(generatedAdaptiveExerciseOutputSchema),
              strict: true,
            },
          },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const responseBody: unknown = await response.json();
      return parseOpenAiResponseOutput(responseBody);
    },
    (candidate) => parseExerciseForRequest(candidate, input),
  );
}
