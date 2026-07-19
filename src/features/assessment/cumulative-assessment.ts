import type { AssessmentScores, LearnerAssessment } from "./assessment.schema";
import type { ConversationTurn } from "./assessment-session.schema";

export const scoreMetrics = [
  "vocabulary",
  "grammar",
  "reasoning",
  "sentenceComplexity",
  "communication",
] as const satisfies ReadonlyArray<keyof AssessmentScores>;

export type CumulativeScores = Readonly<
  Record<(typeof scoreMetrics)[number], number | null>
>;

export function isAssessmentValidForScoring(assessment: LearnerAssessment) {
  return (
    assessment.isGrounded &&
    assessment.isRelevantToFocus &&
    !assessment.languageWarning
  );
}

export function calculateCumulativeScores(
  turns: ReadonlyArray<ConversationTurn>,
): CumulativeScores {
  const scoredAssessments = turns
    .map((turn) => turn.assessment)
    .filter(
      (assessment): assessment is LearnerAssessment =>
        assessment !== null && isAssessmentValidForScoring(assessment),
    );

  return Object.fromEntries(
    scoreMetrics.map((metric) => {
      if (scoredAssessments.length === 0) {
        return [metric, null];
      }

      const total = scoredAssessments.reduce(
        (sum, assessment) => sum + assessment.scores[metric],
        0,
      );

      return [metric, total / scoredAssessments.length];
    }),
  ) as CumulativeScores;
}
