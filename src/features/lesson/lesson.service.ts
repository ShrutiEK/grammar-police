import "server-only";

import {
  generateAdaptiveExerciseRequestSchema,
  type GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";
import { generateExerciseWithFallback } from "./exercise-provider-fallback";
import { readServerEnvironment } from "@/config/environment";
import { generateAdaptiveExerciseWithGemini } from "@/integrations/gemini/gemini.lesson";
import { generateAdaptiveExerciseWithOpenAi } from "@/integrations/openai/openai.lesson";

export async function createAdaptiveExercise(input: unknown) {
  const validatedInput: GenerateAdaptiveExerciseRequest =
    generateAdaptiveExerciseRequestSchema.parse(input);
  const fallbackProvider = readServerEnvironment().GEMINI_API_KEY
    ? generateAdaptiveExerciseWithGemini
    : undefined;

  return generateExerciseWithFallback(
    validatedInput,
    generateAdaptiveExerciseWithOpenAi,
    fallbackProvider,
  );
}
