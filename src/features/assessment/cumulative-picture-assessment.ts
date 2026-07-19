import {
  METRIC_IDS,
  pictureConversationAssessmentSchema,
  type PictureConversationAssessment,
  type PictureConversationMetricResult,
} from "./picture-conversation.schema";
import type { PictureAssessmentAttempt } from "./picture-assessment-history";

const bandValue = {
  emerging: 0,
  developing: 1,
  secure: 2,
  strong: 3,
} as const;

const bands = ["emerging", "developing", "secure", "strong"] as const;

const confidenceWeight = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

const confidences = ["low", "medium", "high"] as const;

function aggregateMetric(
  metricId: (typeof METRIC_IDS)[number],
  assessments: ReadonlyArray<PictureConversationAssessment>,
): PictureConversationMetricResult {
  const metricHistory = assessments
    .map((assessment) =>
      assessment.metrics.find((metric) => metric.id === metricId),
    )
    .filter((metric): metric is PictureConversationMetricResult =>
      Boolean(metric),
    );
  const assessedMetrics = metricHistory.filter(
    (
      metric,
    ): metric is PictureConversationMetricResult & {
      band: NonNullable<PictureConversationMetricResult["band"]>;
    } => metric.status === "assessed" && Boolean(metric.band),
  );

  if (assessedMetrics.length === 0) {
    const latestMetric = metricHistory.at(-1);

    return {
      confidence: "low",
      evidence: [],
      id: metricId,
      status: "not_assessed",
      unavailableReason:
        latestMetric?.unavailableReason ||
        "We need another example to understand this part of your English.",
    };
  }

  const totalWeight = assessedMetrics.reduce(
    (total, metric) => total + confidenceWeight[metric.confidence],
    0,
  );
  const weightedBandValue = assessedMetrics.reduce(
    (total, metric) =>
      total + bandValue[metric.band] * confidenceWeight[metric.confidence],
    0,
  );
  const averageConfidenceWeight = totalWeight / assessedMetrics.length;
  const latestAssessedMetric = assessedMetrics.at(-1)!;
  const evidence = assessedMetrics
    .toReversed()
    .flatMap((metric) => metric.evidence)
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) => candidate.learnerText === item.learnerText,
        ) === index,
    )
    .slice(0, 2);

  return {
    band: bands[Math.round(weightedBandValue / totalWeight)]!,
    confidence:
      confidences[Math.max(0, Math.round(averageConfidenceWeight) - 1)]!,
    evidence,
    id: metricId,
    ...(latestAssessedMetric.nextSkill
      ? { nextSkill: latestAssessedMetric.nextSkill }
      : {}),
    status: "assessed",
    ...(latestAssessedMetric.strength
      ? { strength: latestAssessedMetric.strength }
      : {}),
  };
}

export function createCumulativePictureAssessment(
  attempts: ReadonlyArray<PictureAssessmentAttempt>,
) {
  const latestAssessment = attempts.at(-1)?.feedback.assessment;

  if (!latestAssessment) {
    throw new Error("At least one picture assessment is required.");
  }

  const assessments = attempts.map((attempt) => attempt.feedback.assessment);

  return pictureConversationAssessmentSchema.parse({
    ...latestAssessment,
    metrics: METRIC_IDS.map((metricId) =>
      aggregateMetric(metricId, assessments),
    ),
  });
}
