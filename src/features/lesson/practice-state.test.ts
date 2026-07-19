import { describe, expect, it } from "vitest";

import type { AdaptiveExercise } from "./adaptive-exercise.schema";
import {
  createInitialPracticeState,
  mergeRecentPracticeAttempts,
  recordPracticeAttempt,
} from "./practice-state";

const exercise: AdaptiveExercise = {
  exerciseType: "fill_blank",
  prompt: "Maya carried a ___ umbrella.",
  choices: ["striped", "softly", "carried"],
  correctChoice: 0,
  hint: "Choose a word that describes the umbrella.",
  successMessage: "Striped is a clear adjective.",
  explanation: "Striped describes the noun umbrella.",
};

describe("recordPracticeAttempt", () => {
  it("raises difficulty and records a correct streak", () => {
    const state = recordPracticeAttempt(createInitialPracticeState(), {
      exercise,
      exerciseDifficulty: 1,
      selectedChoice: "striped",
      wasCorrect: true,
    });

    expect(state.difficulty).toBe(2);
    expect(state.consecutiveCorrect).toBe(1);
    expect(state.attempts[0]?.hintUsed).toBe(false);
    expect(state.attempts[0]?.correctAnswer).toBe("striped");
    expect(state.attempts[0]?.exerciseContent).toContain("softly");
  });

  it("keeps difficulty and records supported practice after an error", () => {
    const state = recordPracticeAttempt(createInitialPracticeState(2), {
      exercise,
      exerciseDifficulty: 2,
      selectedChoice: "softly",
      wasCorrect: false,
    });

    expect(state.difficulty).toBe(2);
    expect(state.consecutiveIncorrect).toBe(1);
    expect(state.attempts[0]?.hintUsed).toBe(true);
  });

  it("preserves recent questions for a fresh Play again mission", () => {
    const completedMission = Array.from({ length: 5 }, (_, index) => ({
      prompt: `Question ${index + 1}`,
      difficulty: 1 as const,
      selectedChoice: "answer",
      wasCorrect: true,
      hintUsed: false,
    }));

    expect(mergeRecentPracticeAttempts([], completedMission)).toEqual(
      completedMission,
    );
  });
});
