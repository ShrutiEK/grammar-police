import "server-only";

import { z } from "zod";

import {
  generatedAdaptiveExerciseOutputSchema,
  type GenerateAdaptiveExerciseRequest,
} from "@/features/lesson/adaptive-exercise.schema";
import { parseExerciseForRequest } from "@/features/lesson/adaptive-exercise-quality";
import { retryInvalidExercise } from "@/features/lesson/retry-invalid-exercise";
import { parseStructuredChatCompletion } from "@/integrations/structured-chat-completion";
import { createAdaptiveExercisePrompt } from "@/prompts/lesson/create-adaptive-exercise-prompt";

import { requestOpenAi } from "./openai.client";

const adaptiveExerciseModel = "gpt-5.6-terra";

export async function generateAdaptiveExerciseWithOpenAi(
  input: GenerateAdaptiveExerciseRequest,
) {
  return retryInvalidExercise(
    async (attempt, validationFeedback) => {
      const response = await requestOpenAi("/v1/chat/completions", {
        body: JSON.stringify({
          messages: [
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
          reasoning_effort: "none",
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "adaptive_english_exercise",
              schema: z.toJSONSchema(generatedAdaptiveExerciseOutputSchema),
              strict: true,
            },
          },
          temperature: 0.2,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const responseBody: unknown = await response.json();
      return parseStructuredChatCompletion(responseBody, "OpenAI");
    },
    (candidate) => parseExerciseForRequest(candidate, input),
  );
}
