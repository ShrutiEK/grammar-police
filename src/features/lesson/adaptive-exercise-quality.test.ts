import { describe, expect, it } from "vitest";

import type { GenerateAdaptiveExerciseRequest } from "./adaptive-exercise.schema";
import { parseExerciseForRequest } from "./adaptive-exercise-quality";

const request: GenerateAdaptiveExerciseRequest = {
  track: "grammar",
  skill: "articles",
  skillLabel: "articles",
  band: "emerging",
  learnerEvidence: "I see dog.",
  observation: "The learner omitted an article before a singular noun.",
  difficulty: 1,
  recentAttempts: [],
  previousPrompts: [],
};

const exercise = {
  exerciseType: "fill_blank",
  prompt: "We saw ___ elephant.",
  choices: ["a", "an", "the"],
  correctAnswer: "an",
  hint: "Listen to the first sound in elephant.",
  successMessage: "An comes before a vowel sound.",
  explanation: "Elephant begins with a vowel sound, so an is correct.",
};

describe("parseExerciseForRequest", () => {
  it("accepts a concise, aligned exercise", () => {
    expect(parseExerciseForRequest(exercise, request)).toEqual({
      ...exercise,
      correctAnswer: undefined,
      correctChoice: 1,
    });
  });

  it("rejects a repeated prompt", () => {
    expect(() =>
      parseExerciseForRequest(exercise, {
        ...request,
        previousPrompts: ["We saw ___ elephant."],
      }),
    ).toThrow("too similar");
  });

  it("rejects a format outside the skill blueprint", () => {
    expect(() =>
      parseExerciseForRequest(
        { ...exercise, exerciseType: "choose_best_response" },
        request,
      ),
    ).toThrow("not an allowed format");
  });

  it("rejects an exercise that requires an unseen picture", () => {
    expect(() =>
      parseExerciseForRequest(
        { ...exercise, prompt: "Look at the picture and choose ___ article." },
        request,
      ),
    ).toThrow("cannot see");
  });

  it("rejects a prompt that reveals the correct answer", () => {
    expect(() =>
      parseExerciseForRequest(
        {
          ...exercise,
          prompt: "The correct answer is elephant. Choose ___ elephant.",
          choices: ["a", "an", "elephant"],
          correctAnswer: "elephant",
        },
        request,
      ),
    ).toThrow("reveals the correct answer");
  });

  it("allows a required language form to appear elsewhere in the prompt", () => {
    expect(() =>
      parseExerciseForRequest(
        {
          ...exercise,
          prompt: "Choose the article: I opened a book. ___ book was funny.",
          choices: ["A", "An", "The"],
          correctAnswer: "The",
        },
        { ...request, difficulty: 3 },
      ),
    ).not.toThrow();
  });

  it("accepts ordered comma-separated answers for multiple blanks", () => {
    expect(
      parseExerciseForRequest(
        {
          ...exercise,
          prompt: "Yesterday, I saw ___ elephant near ___ river.",
          choices: ["a, the", "an, the", "the, an"],
          correctAnswer: "an, the",
        },
        { ...request, difficulty: 3 },
      ).choices,
    ).toEqual(["a, the", "an, the", "the, an"]);
  });

  it("rejects choices with too few answers for multiple blanks", () => {
    expect(() =>
      parseExerciseForRequest(
        {
          ...exercise,
          prompt: "Yesterday, I saw ___ elephant near ___ river.",
          choices: ["a", "an", "the"],
        },
        { ...request, difficulty: 3 },
      ),
    ).toThrow("comma-separated answers");
  });
});
