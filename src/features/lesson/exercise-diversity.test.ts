import { describe, expect, it } from "vitest";

import type {
  AdaptiveExercise,
  GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";
import {
  createExerciseDiversityGuidance,
  exerciseDiversityPolicies,
  findExerciseDiversityProblem,
} from "./exercise-diversity";
import { learningSkillSchema } from "./learning-assessment.schema";

const request: GenerateAdaptiveExerciseRequest = {
  track: "vocabulary",
  skill: "precise_nouns",
  skillLabel: "precise nouns",
  band: "emerging",
  learnerEvidence: "The train stopped at a place.",
  observation: "The learner used a vague noun.",
  difficulty: 1,
  previousPrompts: ["A train stops at a ___."],
  recentAttempts: [
    {
      prompt: "A train stops at a ___.",
      exerciseContent: "A train stops at a ___. station | building | transport",
      correctAnswer: "station",
      exerciseType: "fill_blank",
      difficulty: 1,
      selectedChoice: "station",
      wasCorrect: true,
      hintUsed: false,
    },
  ],
};

function exercise(
  prompt: string,
  choices: [string, string, string],
): AdaptiveExercise {
  return {
    exerciseType: "fill_blank",
    prompt,
    choices,
    correctChoice: 0,
    hint: "Choose the most exact noun.",
    successMessage: "That noun is precise.",
    explanation: "It names the exact thing.",
  };
}

describe("exercise diversity", () => {
  it("defines a diversity policy for every learning skill", () => {
    expect(Object.keys(exerciseDiversityPolicies).sort()).toEqual(
      [...learningSkillSchema.options].sort(),
    );
  });

  it("rejects a repeated vocabulary target in rewritten context", () => {
    expect(
      findExerciseDiversityProblem(
        exercise("Passengers wait at the ___.", [
          "station",
          "place",
          "building",
        ]),
        request,
      ),
    ).toContain("target word");
  });

  it("accepts a new target in a different everyday context", () => {
    expect(
      findExerciseDiversityProblem(
        exercise("A doctor listens with a ___.", [
          "stethoscope",
          "tool",
          "thing",
        ]),
        request,
      ),
    ).toBeNull();
  });

  it("rotates the requested context between attempts", () => {
    expect(createExerciseDiversityGuidance(request)).toContain(
      "school or learning",
    );
  });

  it("allows a full mission of distinct exercises with ordinary words in common", () => {
    const exercises = [
      exercise("Put the plates in the ___.", [
        "cupboard",
        "cupbord",
        "cuboard",
      ]),
      exercise("Write your answer on the ___.", ["paper", "papper", "payper"]),
      exercise("We bought bread at the ___.", ["bakery", "bakary", "bakkery"]),
      exercise("The rabbit crossed the ___.", ["garden", "gardan", "gardden"]),
      exercise("She carried her camera in a ___.", [
        "backpack",
        "bakpack",
        "backpak",
      ]),
    ];
    const attempts: GenerateAdaptiveExerciseRequest["recentAttempts"] = [];

    for (const candidate of exercises) {
      expect(
        findExerciseDiversityProblem(candidate, {
          ...request,
          recentAttempts: attempts,
        }),
      ).toBeNull();
      attempts.push({
        prompt: candidate.prompt,
        exerciseContent: `${candidate.prompt} ${candidate.choices.join(" | ")}`,
        correctAnswer: candidate.choices[candidate.correctChoice],
        exerciseType: candidate.exerciseType,
        difficulty: 1,
        selectedChoice: candidate.choices[candidate.correctChoice] ?? "",
        wasCorrect: true,
        hintUsed: false,
      });
    }
  });
});
