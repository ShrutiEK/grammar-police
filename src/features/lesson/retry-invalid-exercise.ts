import { ZodError } from "zod";

import {
  adaptiveExerciseSchema,
  type AdaptiveExercise,
} from "./adaptive-exercise.schema";

export const maximumExerciseGenerationAttempts = 3;

export async function retryInvalidExercise(
  generateCandidate: (
    attempt: number,
    validationFeedback?: string,
  ) => Promise<unknown>,
  validateCandidate: (candidate: unknown) => AdaptiveExercise = (candidate) =>
    adaptiveExerciseSchema.parse(candidate),
): Promise<AdaptiveExercise> {
  let lastValidationError: unknown;
  let validationFeedback: string | undefined;

  for (
    let attempt = 1;
    attempt <= maximumExerciseGenerationAttempts;
    attempt += 1
  ) {
    try {
      return validateCandidate(
        await generateCandidate(attempt, validationFeedback),
      );
    } catch (error) {
      if (!(error instanceof SyntaxError) && !(error instanceof ZodError)) {
        throw error;
      }

      lastValidationError = error;
      validationFeedback =
        error instanceof ZodError
          ? error.issues.map((issue) => issue.message).join("; ")
          : "Return valid JSON matching the required schema.";
      console.warn(
        `AI returned an invalid lesson exercise (attempt ${attempt} of ${maximumExerciseGenerationAttempts}): ${validationFeedback}`,
      );
    }
  }

  throw new Error(
    "The lesson service returned invalid exercises after retrying.",
    { cause: lastValidationError },
  );
}
