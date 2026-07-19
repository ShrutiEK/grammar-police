import { z } from "zod";

import {
  adaptiveExerciseSchema,
  type AdaptiveExercise,
  type GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";

const lessonErrorSchema = z.object({ error: z.string().trim().min(1) });

export async function requestAdaptiveExercise(
  input: GenerateAdaptiveExerciseRequest,
): Promise<AdaptiveExercise> {
  const response = await fetch("/api/lesson/exercise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const error = lessonErrorSchema.safeParse(responseBody);
    throw new Error(
      error.success
        ? error.data.error
        : "We could not build the next challenge. Please try again.",
    );
  }

  return adaptiveExerciseSchema.parse(responseBody);
}
