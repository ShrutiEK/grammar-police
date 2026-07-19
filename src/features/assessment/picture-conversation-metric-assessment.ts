import { logAssessmentProgress } from "./assessment-progress-log";
import {
  METRIC_IDS,
  pictureConversationAssessmentSchema,
  type AssessableMetricId,
  type MetricId,
  type PictureConversationAssessment,
  type PictureConversationAssessmentInput,
  type PictureConversationMetricResult,
  type ReportPictureConversationProgress,
} from "./picture-conversation.schema";

type AssessMetric = (
  metricId: AssessableMetricId,
  input: PictureConversationAssessmentInput,
) => Promise<PictureConversationMetricResult>;

type MetricAssessmentProvider = Readonly<{
  assessMetric: AssessMetric;
  providerName: string;
}>;

const metricTrack = {
  conversation: "conversation",
  expression: "expression",
  grammar: "grammar",
  pronunciation: "pronunciation",
  scene_understanding: "scene_description",
  spoken_fluency: "spoken_fluency",
  vocabulary: "vocabulary",
  writing_conventions: "writing_conventions",
} as const satisfies Record<
  MetricId,
  PictureConversationAssessment["primaryRecommendation"]["track"]
>;

const metricLabel = {
  conversation: "conversation",
  expression: "sharing ideas",
  grammar: "grammar",
  pronunciation: "pronunciation",
  scene_understanding: "understanding the picture",
  spoken_fluency: "speaking flow",
  vocabulary: "word choice",
  writing_conventions: "writing details",
} as const satisfies Record<MetricId, string>;

const metricPriority: readonly MetricId[] = [
  "grammar",
  "vocabulary",
  "expression",
  "conversation",
  "scene_understanding",
  "spoken_fluency",
  "writing_conventions",
  "pronunciation",
];

const bandPriority = {
  developing: 1,
  emerging: 0,
  secure: 2,
  strong: 3,
} as const;

function hasEnglishEvidence(
  input: PictureConversationAssessmentInput,
  predicate: (
    turn: PictureConversationAssessmentInput["turns"][number],
  ) => boolean,
) {
  return input.turns.some(
    (turn) =>
      !turn.languageWarning && turn.isRelevantToFocus && predicate(turn),
  );
}

export function getEligiblePictureConversationMetricIds(
  input: PictureConversationAssessmentInput,
): AssessableMetricId[] {
  const eligibleMetricIds: AssessableMetricId[] = [];
  const hasAnyEnglishAnswer = hasEnglishEvidence(input, () => true);

  if (
    hasEnglishEvidence(input, (turn) =>
      ["scene_description", "picture_follow_up"].includes(turn.kind),
    )
  ) {
    eligibleMetricIds.push("scene_understanding");
  }

  if (hasAnyEnglishAnswer) {
    eligibleMetricIds.push("grammar", "vocabulary", "expression");
  }

  if (hasEnglishEvidence(input, (turn) => turn.kind === "personal_follow_up")) {
    eligibleMetricIds.push("conversation");
  }

  if (hasEnglishEvidence(input, (turn) => turn.answerMode === "written")) {
    eligibleMetricIds.push("writing_conventions");
  }

  if (
    hasEnglishEvidence(
      input,
      (turn) =>
        turn.answerMode === "spoken" &&
        typeof turn.audioDurationInSeconds === "number",
    )
  ) {
    eligibleMetricIds.push("spoken_fluency");
  }

  return eligibleMetricIds;
}

function getUnavailableReason(
  metricId: MetricId,
  input: PictureConversationAssessmentInput,
) {
  if (metricId === "pronunciation") {
    return "Coming soon.";
  }

  if (
    metricId === "spoken_fluency" &&
    input.turns.some((turn) => turn.answerMode === "spoken")
  ) {
    return "We need reliable recording timing to understand speaking flow.";
  }

  if (metricId === "spoken_fluency") {
    return "Try a spoken answer so we can understand your speaking flow.";
  }

  if (metricId === "writing_conventions") {
    return "Try a written answer so we can understand your writing details.";
  }

  if (metricId === "conversation") {
    return "Answer a personal follow-up so we can understand conversation skills.";
  }

  return "We need another example to understand this part of your English.";
}

function selectPrimaryMetric(metrics: PictureConversationMetricResult[]) {
  return metrics
    .filter(
      (
        metric,
      ): metric is PictureConversationMetricResult & {
        band: NonNullable<PictureConversationMetricResult["band"]>;
        nextSkill: NonNullable<PictureConversationMetricResult["nextSkill"]>;
      } =>
        metric.status === "assessed" &&
        Boolean(metric.band) &&
        Boolean(metric.nextSkill),
    )
    .sort((left, right) => {
      const bandDifference = bandPriority[left.band] - bandPriority[right.band];

      if (bandDifference !== 0) {
        return bandDifference;
      }

      return metricPriority.indexOf(left.id) - metricPriority.indexOf(right.id);
    })[0];
}

function createLearnerSummary(
  assessedMetrics: PictureConversationMetricResult[],
  primaryMetric: NonNullable<ReturnType<typeof selectPrimaryMetric>>,
) {
  const strongAreas = assessedMetrics
    .filter(
      (metric) =>
        metric.status === "assessed" &&
        (metric.band === "secure" || metric.band === "strong"),
    )
    .slice(0, 2)
    .map((metric) => metricLabel[metric.id]);
  const nextSkill = primaryMetric.nextSkill.replaceAll("_", " ");

  if (strongAreas.length > 0) {
    return `You shared useful ideas and showed progress in ${strongAreas.join(" and ")}. Your next step is to practise ${nextSkill}.`;
  }

  return `You shared enough English for us to find a helpful next step. Practise ${nextSkill} to make your communication clearer.`;
}

function createAssessment(
  input: PictureConversationAssessmentInput,
  providerMetrics: PictureConversationMetricResult[],
) {
  const metricsById = new Map(
    providerMetrics.map((metric) => [metric.id, metric]),
  );
  const metrics = METRIC_IDS.map(
    (metricId): PictureConversationMetricResult =>
      metricsById.get(metricId) || {
        confidence: "low",
        evidence: [],
        id: metricId,
        status: "not_assessed",
        unavailableReason: getUnavailableReason(metricId, input),
      },
  );
  const primaryMetric = selectPrimaryMetric(metrics);

  if (!primaryMetric) {
    throw new Error("The provider did not return an assessed metric.");
  }

  const nextSkill = primaryMetric.nextSkill.replaceAll("_", " ");
  const observation = primaryMetric.evidence[0]?.observation;
  const reason = observation
    ? `${observation} Next, practise ${nextSkill}.`
    : `Practise ${nextSkill} to strengthen ${metricLabel[primaryMetric.id]}.`;

  return pictureConversationAssessmentSchema.parse({
    learnerSummary: createLearnerSummary(metrics, primaryMetric),
    metrics,
    primaryRecommendation: {
      reason: reason.slice(0, 300),
      skill: primaryMetric.nextSkill,
      track: metricTrack[primaryMetric.id],
    },
  });
}

export async function assessPictureConversationMetricsIndividually(
  input: PictureConversationAssessmentInput,
  { assessMetric, providerName }: MetricAssessmentProvider,
  reportProgress?: ReportPictureConversationProgress,
) {
  const metricIds = getEligiblePictureConversationMetricIds(input);
  const completedMetrics: PictureConversationMetricResult[] = [];
  const concurrency = 2;

  reportProgress?.({
    completedMetricIds: [],
    stage: "calculating",
    totalMetrics: metricIds.length,
  });
  logAssessmentProgress(`${providerName} eligible metrics selected`, {
    metricIds,
  });

  for (let index = 0; index < metricIds.length; index += concurrency) {
    const batch = metricIds.slice(index, index + concurrency);
    const results = await Promise.allSettled(
      batch.map((metricId) => assessMetric(metricId, input)),
    );

    results.forEach((result, resultIndex) => {
      const metricId = batch[resultIndex];

      if (!metricId) {
        return;
      }

      if (result.status === "fulfilled") {
        completedMetrics.push(result.value);
        reportProgress?.({
          completedMetricIds: completedMetrics.map((metric) => metric.id),
          stage: "calculating",
          totalMetrics: metricIds.length,
        });
        logAssessmentProgress(`${providerName} metric completed`, {
          metricId,
          metricStatus: result.value.status,
        });
        return;
      }

      logAssessmentProgress(`${providerName} metric failed`, {
        errorName:
          result.reason instanceof Error ? result.reason.name : "UnknownError",
        metricId,
      });
    });
  }

  const assessment = createAssessment(input, completedMetrics);
  reportProgress?.({
    completedMetricIds: completedMetrics.map((metric) => metric.id),
    stage: "summarizing",
    totalMetrics: metricIds.length,
  });
  logAssessmentProgress(`${providerName} metric results combined`, {
    assessedMetricCount: assessment.metrics.filter(
      (metric) => metric.status === "assessed",
    ).length,
  });

  return assessment;
}
