import type {
  AdaptiveExercise,
  GenerateAdaptiveExerciseRequest,
} from "./adaptive-exercise.schema";
import type { LearningSkill } from "./learning-assessment.schema";

const contextRotation = [
  "home and daily routines",
  "school or learning",
  "food and shopping",
  "outdoors and nature",
  "hobbies and games",
  "community places and travel",
] as const;

type DiversityPolicy = "context" | "scenario" | "target_answer";

export const exerciseDiversityPolicies = {
  articles: "context",
  present_continuous: "context",
  past_tense: "context",
  future_forms: "context",
  subject_verb_agreement: "context",
  plural_nouns: "target_answer",
  prepositions: "context",
  pronouns: "context",
  question_forms: "context",
  precise_nouns: "target_answer",
  action_verbs: "target_answer",
  descriptive_adjectives: "target_answer",
  descriptive_adverbs: "target_answer",
  word_variety: "target_answer",
  topic_vocabulary: "target_answer",
  complete_sentences: "scenario",
  sentence_connectors: "scenario",
  sentence_variety: "scenario",
  narrative_sequence: "scenario",
  detail_expansion: "scenario",
  answer_expansion: "scenario",
  turn_taking: "scenario",
  scene_detail_noticing: "scenario",
  spatial_language: "scenario",
  action_relationships: "scenario",
  read_aloud_pacing: "scenario",
  pause_chunking: "scenario",
  filler_reduction: "scenario",
  sound_articulation: "context",
  word_stress: "context",
  sentence_stress_and_intonation: "context",
  spelling: "target_answer",
  capitalisation: "context",
  punctuation: "context",
} as const satisfies Record<LearningSkill, DiversityPolicy>;

const ignoredContextWords = new Set([
  "a",
  "an",
  "and",
  "answer",
  "best",
  "choose",
  "correct",
  "fill",
  "for",
  "in",
  "is",
  "it",
  "of",
  "please",
  "select",
  "sentence",
  "the",
  "to",
  "was",
  "which",
  "word",
  "your",
]);

export function createExerciseDiversityGuidance(
  request: GenerateAdaptiveExerciseRequest,
) {
  const context =
    contextRotation[request.recentAttempts.length % contextRotation.length];
  const previousAnswers = request.recentAttempts
    .map((attempt) => attempt.correctAnswer)
    .filter((answer): answer is string => Boolean(answer));
  const skillRule = getSkillDiversityRule(
    exerciseDiversityPolicies[request.skill],
  );

  return `Use a fresh setting based on ${context}. ${skillRule}\nRecent correct answers not to copy unless the skill necessarily has a closed answer set: ${previousAnswers.length ? previousAnswers.join(", ") : "None"}.`;
}

export function findExerciseDiversityProblem(
  exercise: AdaptiveExercise,
  request: GenerateAdaptiveExerciseRequest,
) {
  const correctAnswer = exercise.choices[exercise.correctChoice];
  if (
    correctAnswer &&
    exerciseDiversityPolicies[request.skill] === "target_answer" &&
    request.recentAttempts.some(
      (attempt) =>
        attempt.correctAnswer?.toLocaleLowerCase("en").trim() ===
        correctAnswer.toLocaleLowerCase("en").trim(),
    )
  ) {
    return "Use a different target word; the correct vocabulary answer was already practised recently.";
  }

  const currentContent = `${exercise.prompt} ${exercise.choices.join(" ")}`;
  if (
    request.recentAttempts.some((attempt) => {
      const previousContent = attempt.exerciseContent ?? attempt.prompt;
      return sharesDistinctiveContext(currentContent, previousContent);
    })
  ) {
    return "Use a genuinely different everyday context, not the same topic with slightly different wording.";
  }

  return null;
}

function getSkillDiversityRule(policy: DiversityPolicy) {
  if (policy === "target_answer") {
    return "Teach a different target word from every recent correct answer. Do not merely place the same target word in a rewritten sentence.";
  }

  if (policy === "scenario") {
    return "Use a different communicative purpose and situation. Do not rename characters while preserving the same underlying scenario.";
  }

  return "The language form may repeat when the skill requires it, but the people, objects, actions, and situation must change.";
}

function sharesDistinctiveContext(left: string, right: string) {
  const leftWords = getDistinctiveWords(left);
  const rightWords = getDistinctiveWords(right);
  const sharedWords = [...leftWords].filter((word) => rightWords.has(word));
  const smallerContextSize = Math.min(leftWords.size, rightWords.size);

  if (smallerContextSize === 0 || sharedWords.length < 3) return false;
  return sharedWords.length / smallerContextSize >= 0.5;
}

function getDistinctiveWords(value: string) {
  return new Set(
    (value.toLocaleLowerCase("en").match(/[a-z']+/g) ?? []).filter(
      (word) => word.length > 2 && !ignoredContextWords.has(word),
    ),
  );
}
