import type {
  AdaptiveExercise,
  GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";

type ExerciseProvider = (
  input: GenerateAdaptiveExerciseRequest,
) => Promise<AdaptiveExercise>;

export async function generateExerciseWithFallback(
  input: GenerateAdaptiveExerciseRequest,
  primaryProvider: ExerciseProvider,
  fallbackProvider?: ExerciseProvider,
) {
  try {
    return await primaryProvider(input);
  } catch (primaryError) {
    if (!fallbackProvider) throw primaryError;

    console.warn(
      "Primary adaptive-exercise provider failed after retries; using the backup provider.",
    );
    return fallbackProvider(input);
  }
}
