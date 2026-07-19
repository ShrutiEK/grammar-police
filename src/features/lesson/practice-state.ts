import type {
  AdaptiveExercise,
  ExerciseDifficulty,
  PracticeAttempt,
} from "./adaptive-exercise.schema";
import { getNextDifficulty } from "./adaptive-difficulty";

export type SkillPracticeState = Readonly<{
  difficulty: ExerciseDifficulty;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  attempts: PracticeAttempt[];
}>;

export function createInitialPracticeState(
  difficulty: ExerciseDifficulty = 1,
): SkillPracticeState {
  return {
    difficulty,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    attempts: [],
  };
}

type RecordPracticeAttemptInput = Readonly<{
  exercise: AdaptiveExercise;
  exerciseDifficulty: ExerciseDifficulty;
  selectedChoice: string;
  wasCorrect: boolean;
}>;

export function recordPracticeAttempt(
  state: SkillPracticeState,
  input: RecordPracticeAttemptInput,
): SkillPracticeState {
  const attempt: PracticeAttempt = {
    prompt: input.exercise.prompt,
    difficulty: input.exerciseDifficulty,
    selectedChoice: input.selectedChoice,
    wasCorrect: input.wasCorrect,
    hintUsed: !input.wasCorrect,
  };

  return {
    difficulty: getNextDifficulty(input.exerciseDifficulty, input.wasCorrect),
    consecutiveCorrect: input.wasCorrect ? state.consecutiveCorrect + 1 : 0,
    consecutiveIncorrect: input.wasCorrect ? 0 : state.consecutiveIncorrect + 1,
    attempts: [...state.attempts, attempt].slice(-8),
  };
}
