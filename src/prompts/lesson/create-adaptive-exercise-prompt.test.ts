import { describe, expect, it } from "vitest";

import type { GenerateAdaptiveExerciseRequest } from "@/features/lesson/adaptive-exercise.schema";

import { createAdaptiveExercisePrompt } from "./create-adaptive-exercise-prompt";

const input: GenerateAdaptiveExerciseRequest = {
  track: "vocabulary",
  skill: "descriptive_adjectives",
  skillLabel: "descriptive adjectives",
  band: "emerging",
  learnerEvidence: "There is a kite.",
  observation: "The learner used few descriptive details.",
  difficulty: 1,
  recentAttempts: [],
  previousPrompts: [],
};

describe("createAdaptiveExercisePrompt", () => {
  it("includes metric evidence, skill rubric, and only relevant few-shots", () => {
    const prompt = createAdaptiveExercisePrompt(input);

    expect(prompt).toContain("ASSESSMENT BAND: emerging");
    expect(prompt).toContain("The learner used few descriptive details.");
    expect(prompt).toContain("Maya carried a ___ umbrella.");
    expect(prompt).toContain("GOOD fill_blank");
    expect(prompt).toContain("GOOD choose_precise_word");
    expect(prompt).toContain("GOOD correct_sentence");
    expect(prompt).not.toContain("GOOD join_ideas");
    expect(prompt).not.toContain("We saw ___ elephant.");
  });

  it("adds more scaffolding after repeated incorrect attempts", () => {
    const prompt = createAdaptiveExercisePrompt({
      ...input,
      recentAttempts: [
        {
          prompt: "Choose an adjective.",
          difficulty: 1,
          selectedChoice: "softly",
          wasCorrect: false,
          hintUsed: true,
        },
        {
          prompt: "Choose a describing word.",
          difficulty: 1,
          selectedChoice: "runs",
          wasCorrect: false,
          hintUsed: true,
        },
      ],
    });

    expect(prompt).toContain("missed this level repeatedly");
    expect(prompt).toContain("Keep the requested difficulty");
  });

  it("requires independent answer and explanation verification", () => {
    const prompt = createAdaptiveExercisePrompt(input);

    expect(prompt).toContain("MANDATORY QUALITY CHECK");
    expect(prompt).toContain("answer the question yourself");
    expect(prompt).toContain("Test every other choice");
    expect(prompt).toContain("supports correctAnswer without contradicting");
    expect(prompt).toContain('correctAnswer "a"');
  });
});
