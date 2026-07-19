import type {
  ExerciseDifficulty,
  ExerciseType,
} from "./adaptive-exercise.schema";
import type { LearningSkill } from "./learning-assessment.schema";
import { skillBlueprintSeeds } from "./skill-blueprint-seeds";

type DifficultyRubric = Readonly<Record<ExerciseDifficulty, string>>;

export type ExerciseFewShot = Readonly<{
  label: "good" | "bad";
  content: string;
  reason?: string;
}>;

export type ExerciseBlueprint = Readonly<{
  skill: LearningSkill;
  goal: string;
  allowedExerciseTypes: ExerciseType[];
  difficultyRubric: DifficultyRubric;
  commonMisconceptions: string[];
  distractorRules: string[];
  fewShots: ExerciseFewShot[];
}>;

const genericDifficultyRubric: DifficultyRubric = {
  1: "Recognise one clear example using familiar words and clearly different distractors.",
  2: "Complete one guided sentence using simple, plausible distractors.",
  3: "Apply the skill in a short everyday sentence with closer distractors.",
  4: "Edit or contrast closely related forms in a concise context.",
  5: "Transfer the skill to an unfamiliar concise context with subtle distractors.",
};

const focusedBlueprints: Partial<Record<LearningSkill, ExerciseBlueprint>> = {
  articles: {
    skill: "articles",
    goal: "Choose a, an, the, or no article based on sound and whether a noun is new or specific.",
    allowedExerciseTypes: ["fill_blank", "correct_sentence"],
    difficultyRubric: {
      1: "Choose a or an before one familiar singular noun using its first sound.",
      2: "Choose a or an when a singular noun is introduced for the first time.",
      3: "Contrast a/an for a new noun with the for a noun already identified.",
      4: "Choose among a, an, the, and no article in a concise natural sentence.",
      5: "Resolve a subtle article choice using shared knowledge or specific context.",
    },
    commonMisconceptions: [
      "Choosing a or an from the written first letter instead of the first sound.",
      "Using the for every singular noun.",
      "Omitting an article before a singular countable noun.",
    ],
    distractorRules: [
      "Use only grammatically plausible article alternatives.",
      "Do not make vocabulary knowledge determine the answer.",
    ],
    fewShots: [
      {
        label: "good",
        content:
          'exerciseType: fill_blank; prompt: "We saw ___ elephant."; choices: ["a", "an", "the"]; correctAnswer: "an"',
      },
      {
        label: "good",
        content:
          'exerciseType: fill_blank; prompt: "I opened a book. ___ book was funny."; choices: ["A", "An", "The"]; correctAnswer: "The"',
      },
      {
        label: "bad",
        content: 'prompt: "Choose the correct article."',
        reason:
          "There is no noun or sentence, so the learner cannot apply the rule.",
      },
    ],
  },
  descriptive_adjectives: {
    skill: "descriptive_adjectives",
    goal: "Choose useful adjectives that describe a noun precisely without adding irrelevant words.",
    allowedExerciseTypes: [
      "fill_blank",
      "choose_precise_word",
      "correct_sentence",
    ],
    difficultyRubric: {
      1: "Recognise a common adjective among words from different parts of speech.",
      2: "Choose a familiar adjective that naturally describes a named noun.",
      3: "Choose the most precise adjective for a short complete sentence.",
      4: "Replace a vague or repetitive adjective with a more informative one.",
      5: "Distinguish subtle adjective meanings in a concise unfamiliar context.",
    },
    commonMisconceptions: [
      "Confusing adjectives with adverbs or verbs.",
      "Choosing a vivid word that does not logically describe the noun.",
      "Repeating vague adjectives such as good, nice, or big.",
    ],
    distractorRules: [
      "At early levels, include one adverb or verb as a misconception distractor.",
      "At higher levels, use adjectives with different but plausible meanings.",
    ],
    fewShots: [
      {
        label: "good",
        content:
          'exerciseType: fill_blank; prompt: "Maya carried a ___ umbrella."; choices: ["striped", "softly", "carried"]; correctAnswer: "striped"',
      },
      {
        label: "good",
        content:
          'exerciseType: choose_precise_word; prompt: "Choose the most precise word: The path was ___."; choices: ["narrow", "nice", "thing"]; correctAnswer: "narrow"',
      },
      {
        label: "bad",
        content: 'prompt: "The kite was bright. Which word means bright?"',
        reason:
          "The question repeats the answer instead of practising adjective use.",
      },
    ],
  },
  present_continuous: {
    skill: "present_continuous",
    goal: "Use am, is, or are with an -ing verb for an action happening now.",
    allowedExerciseTypes: ["fill_blank", "correct_sentence"],
    difficultyRubric: {
      1: "Recognise a complete is/are + -ing form for one familiar action.",
      2: "Choose am, is, or are for a stated subject before an -ing verb.",
      3: "Form the complete present continuous in a short action sentence.",
      4: "Correct agreement or spelling in a plausible present-continuous sentence.",
      5: "Contrast an action happening now with a habit using concise context.",
    },
    commonMisconceptions: [
      "Omitting am, is, or are.",
      "Using the wrong helper verb for the subject.",
      "Using a base verb instead of an -ing form.",
    ],
    distractorRules: [
      "Use one missing-helper and one wrong-agreement distractor when suitable.",
      "Keep the action verb familiar so grammar remains the target.",
    ],
    fewShots: [
      {
        label: "good",
        content:
          'exerciseType: correct_sentence; prompt: "Choose the action happening now."; choices: ["She is running.", "She running.", "She is run."]; correctAnswer: "She is running."',
      },
      {
        label: "good",
        content:
          'exerciseType: fill_blank; prompt: "They ___ eating lunch now."; choices: ["are", "is", "am"]; correctAnswer: "are"',
      },
      {
        label: "bad",
        content: 'prompt: "What are they doing in the picture?"',
        reason: "The required picture is unavailable.",
      },
    ],
  },
  sentence_connectors: {
    skill: "sentence_connectors",
    goal: "Connect ideas using and, but, because, or so according to their relationship.",
    allowedExerciseTypes: ["fill_blank", "join_ideas"],
    difficultyRubric: {
      1: "Recognise and for addition or but for a clear contrast.",
      2: "Choose because for a reason or so for a result.",
      3: "Select among addition, contrast, reason, and result in one short sentence.",
      4: "Distinguish connectors with closely related meanings in concise context.",
      5: "Choose the connector that best expresses a subtle logical relationship.",
    },
    commonMisconceptions: [
      "Confusing because, which introduces a reason, with so, which introduces a result.",
      "Using and when the ideas contrast.",
      "Choosing a connector that is grammatical but changes the intended meaning.",
    ],
    distractorRules: [
      "Every distractor should create a different logical relationship.",
      "Keep both ideas explicit so no outside context is required.",
    ],
    fewShots: [
      {
        label: "good",
        content:
          'exerciseType: fill_blank; prompt: "I wore a coat ___ it was cold."; choices: ["because", "but", "so"]; correctAnswer: "because"',
      },
      {
        label: "good",
        content:
          'exerciseType: join_ideas; prompt: "It rained, ___ we stayed inside."; choices: ["so", "because", "but"]; correctAnswer: "so"',
      },
      {
        label: "bad",
        content: 'prompt: "Choose a connector."',
        reason: "The relationship between ideas is missing.",
      },
    ],
  },
};

export function getExerciseBlueprint(skill: LearningSkill): ExerciseBlueprint {
  const focusedBlueprint = focusedBlueprints[skill];
  if (focusedBlueprint) return focusedBlueprint;

  const seed = skillBlueprintSeeds[skill];
  if (!seed.supported) {
    throw new Error(seed.reason);
  }

  return {
    skill,
    goal: seed.goal,
    allowedExerciseTypes: seed.allowedExerciseTypes,
    difficultyRubric: genericDifficultyRubric,
    commonMisconceptions: [seed.misconception],
    distractorRules: [
      "Keep all choices concise and make only one defensibly correct.",
      `Use distractors that reflect this realistic learner error: ${seed.misconception}`,
    ],
    fewShots: [
      {
        label: "good",
        content: seed.goodExample,
      },
      {
        label: "bad",
        content: "A question that requires an unseen picture or passage.",
        reason: "The exercise must include all information needed to answer.",
      },
    ],
  };
}

export function getDifficultyGuidance(
  blueprint: ExerciseBlueprint,
  difficulty: ExerciseDifficulty,
) {
  return blueprint.difficultyRubric[difficulty];
}
