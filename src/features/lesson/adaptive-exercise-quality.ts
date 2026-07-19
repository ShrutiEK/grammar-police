import type {
  AdaptiveExercise,
  GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";
import {
  adaptiveExerciseSchema,
  generatedAdaptiveExerciseSchema,
} from "./adaptive-exercise.schema";
import { getExerciseBlueprint } from "./exercise-blueprint";
import { findExerciseDiversityProblem } from "./exercise-diversity";

const unavailableContextPattern =
  /\b(?:picture|image|photo|illustration|shown above|shown below|this object|that object)\b/i;

export function parseExerciseForRequest(
  candidate: unknown,
  request: GenerateAdaptiveExerciseRequest,
): AdaptiveExercise {
  const blueprint = getExerciseBlueprint(request.skill);
  const generatedExercise = generatedAdaptiveExerciseSchema.parse(candidate);

  return adaptiveExerciseSchema
    .superRefine((exercise, context) => {
      if (!blueprint.allowedExerciseTypes.includes(exercise.exerciseType)) {
        context.addIssue({
          code: "custom",
          message: `${exercise.exerciseType} is not an allowed format for ${request.skill}.`,
          path: ["exerciseType"],
        });
      }

      if (unavailableContextPattern.test(exercise.prompt)) {
        context.addIssue({
          code: "custom",
          message: "The question refers to content the learner cannot see.",
          path: ["prompt"],
        });
      }

      if (exercise.prompt.split(/\s+/).length > 40) {
        context.addIssue({
          code: "custom",
          message: "The question is too long; keep it concise.",
          path: ["prompt"],
        });
      }

      if (
        exercise.exerciseType === "fill_blank" &&
        !exercise.prompt.includes("___")
      ) {
        context.addIssue({
          code: "custom",
          message: "A fill-in-the-blank question requires a ___ blank.",
          path: ["prompt"],
        });
      }

      const blankCount = exercise.prompt.match(/___/g)?.length ?? 0;
      if (blankCount > 1) {
        exercise.choices.forEach((choice, choiceIndex) => {
          const answerPartCount = choice
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean).length;

          if (answerPartCount !== blankCount) {
            context.addIssue({
              code: "custom",
              message: `Choice ${choiceIndex + 1} must contain ${blankCount} comma-separated answers for ${blankCount} blanks.`,
              path: ["choices", choiceIndex],
            });
          }
        });
      }

      if (
        request.previousPrompts.some(
          (previousPrompt) =>
            calculateWordSimilarity(previousPrompt, exercise.prompt) >= 0.8,
        )
      ) {
        context.addIssue({
          code: "custom",
          message: "The question is too similar to a recent question.",
          path: ["prompt"],
        });
      }

      const diversityProblem = findExerciseDiversityProblem(exercise, request);
      if (diversityProblem) {
        context.addIssue({
          code: "custom",
          message: diversityProblem,
          path: ["prompt"],
        });
      }

      if (!isTargetSkillVisible(exercise, request.skill)) {
        context.addIssue({
          code: "custom",
          message: `The question does not clearly practise ${request.skill}.`,
          path: ["prompt"],
        });
      }

      const correctChoice = exercise.choices[exercise.correctChoice];
      if (
        correctChoice &&
        doesPromptRevealAnswer(exercise.prompt, correctChoice)
      ) {
        context.addIssue({
          code: "custom",
          message: "The question reveals the correct answer in the prompt.",
          path: ["prompt"],
        });
      }
    })
    .parse(generatedExercise);
}

const reusableLanguageForms = new Set([
  "a",
  "am",
  "an",
  "and",
  "are",
  "because",
  "but",
  "is",
  "so",
  "the",
]);

function doesPromptRevealAnswer(prompt: string, correctChoice: string) {
  const normalisedChoice = normaliseText(correctChoice);
  if (
    normalisedChoice.length < 3 ||
    reusableLanguageForms.has(normalisedChoice)
  ) {
    return false;
  }

  return normaliseText(prompt).includes(normalisedChoice);
}

function calculateWordSimilarity(left: string, right: string) {
  const leftWords = normaliseWords(left);
  const rightWords = normaliseWords(right);
  const union = new Set([...leftWords, ...rightWords]);
  if (union.size === 0) return 1;

  const intersectionSize = [...leftWords].filter((word) =>
    rightWords.has(word),
  ).length;
  return intersectionSize / union.size;
}

function normaliseWords(value: string) {
  return new Set(value.toLocaleLowerCase("en").match(/[a-z']+/g) ?? []);
}

function normaliseText(value: string) {
  return value
    .toLocaleLowerCase("en")
    .replace(/[^a-z']+/g, " ")
    .trim();
}

function isTargetSkillVisible(
  exercise: AdaptiveExercise,
  skill: GenerateAdaptiveExerciseRequest["skill"],
) {
  const exerciseText = `${exercise.prompt} ${exercise.choices.join(" ")}`;

  if (skill === "articles") {
    return /(?:^|\s)(?:a|an|the)(?:\s|[.,!?]|$)/i.test(exerciseText);
  }

  if (skill === "present_continuous") {
    return (
      /\b(?:am|is|are)\b/i.test(exerciseText) &&
      /\b\w+ing\b/i.test(exerciseText)
    );
  }

  if (skill === "sentence_connectors") {
    return /\b(?:and|but|because|so)\b/i.test(exerciseText);
  }

  if (skill === "descriptive_adjectives") {
    return ["fill_blank", "choose_precise_word", "correct_sentence"].includes(
      exercise.exerciseType,
    );
  }

  return true;
}
