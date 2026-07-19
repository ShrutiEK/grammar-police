import { describe, expect, it, vi } from "vitest";

import type { GenerateAdaptiveExerciseRequest } from "./adaptive-exercise.schema";
import { generateExerciseWithFallback } from "./exercise-provider-fallback";

const input = {} as GenerateAdaptiveExerciseRequest;
const exercise = {
  exerciseType: "fill_blank" as const,
  prompt: "We saw ___ elephant.",
  choices: ["a", "an", "the"],
  correctChoice: 1,
  hint: "Listen to the first sound.",
  successMessage: "Correct!",
  explanation: "Elephant starts with a vowel sound.",
};

describe("generateExerciseWithFallback", () => {
  it("returns the primary result without calling the fallback", async () => {
    const primary = vi.fn(async () => exercise);
    const fallback = vi.fn(async () => exercise);

    await expect(
      generateExerciseWithFallback(input, primary, fallback),
    ).resolves.toEqual(exercise);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("uses the fallback after the primary exhausts its attempts", async () => {
    const primary = vi.fn(async () => {
      throw new Error("Primary failed");
    });
    const fallback = vi.fn(async () => exercise);

    await expect(
      generateExerciseWithFallback(input, primary, fallback),
    ).resolves.toEqual(exercise);
    expect(fallback).toHaveBeenCalledWith(input);
  });

  it("preserves the primary error when no fallback is configured", async () => {
    const primaryError = new Error("Primary failed");
    const primary = vi.fn(async () => {
      throw primaryError;
    });

    await expect(generateExerciseWithFallback(input, primary)).rejects.toBe(
      primaryError,
    );
  });
});
