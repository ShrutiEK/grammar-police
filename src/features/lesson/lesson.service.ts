import "server-only";

import {
  generateAdaptiveExerciseRequestSchema,
  type GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";
import { generateAdaptiveExerciseWithOpenAi } from "@/integrations/openai/openai.lesson";

export async function createAdaptiveExercise(input: unknown) {
  const validatedInput: GenerateAdaptiveExerciseRequest =
    generateAdaptiveExerciseRequestSchema.parse(input);
  return generateAdaptiveExerciseWithOpenAi(validatedInput);
}
