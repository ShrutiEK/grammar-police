import type { ExerciseDifficulty } from "./adaptive-exercise.schema";
import type { MetricBand } from "./learning-assessment.schema";

const startingDifficultyByBand: Readonly<
  Record<MetricBand, ExerciseDifficulty>
> = {
  emerging: 1,
  developing: 2,
  secure: 3,
  strong: 4,
};

export function getStartingDifficulty(band: MetricBand): ExerciseDifficulty {
  return startingDifficultyByBand[band];
}

export function getNextDifficulty(
  currentDifficulty: ExerciseDifficulty,
  wasCorrect: boolean,
): ExerciseDifficulty {
  if (!wasCorrect) return currentDifficulty;
  return Math.min(currentDifficulty + 1, 5) as ExerciseDifficulty;
}
