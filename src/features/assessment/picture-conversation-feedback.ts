import type {
  MetricId,
  PictureConversationAssessment,
  PictureConversationFeedback,
} from "./picture-conversation.schema";

const refinementPrompts: Partial<Record<MetricId, string>> = {
  conversation:
    "Would you like to share one more personal detail, reason, or example?",
  expression:
    "Would you like to add one more sentence with a detail about the picture?",
  scene_understanding:
    "Would you like to tell us more about who or what you can see in the picture?",
};

export function getNextConversationPrompt(
  assessment: PictureConversationAssessment,
) {
  const metricNeedingMoreEvidence = assessment.metrics.find(
    (metric) => metric.status === "not_assessed",
  );

  return metricNeedingMoreEvidence
    ? refinementPrompts[metricNeedingMoreEvidence.id]
    : undefined;
}

export function createPictureConversationFeedback(
  assessment: PictureConversationAssessment,
): PictureConversationFeedback {
  return {
    assessment,
    nextConversationPrompt: getNextConversationPrompt(assessment),
    status: "assessed",
  };
}
