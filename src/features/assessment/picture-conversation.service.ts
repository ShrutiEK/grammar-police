import "server-only";

import { assessMetricWithGemini } from "@/integrations/gemini/gemini.picture-conversation";
import { assessMetricWithOpenAi } from "@/integrations/openai/openai.picture-conversation";
import { pictureDescriptions } from "@/picture-descriptions/picture-descriptions.data";

import { logAssessmentProgress } from "./assessment-progress-log";
import { createPictureConversationFeedback } from "./picture-conversation-feedback";
import { assessPictureConversationMetricsIndividually } from "./picture-conversation-metric-assessment";
import { assessMetricWithProviderFallback } from "./picture-conversation-provider-fallback";
import type {
  PictureConversationFeedback,
  PictureConversationInput,
  ReportPictureConversationProgress,
} from "./picture-conversation.schema";

export async function assessSubmittedPictureConversation(
  input: PictureConversationInput,
  reportProgress?: ReportPictureConversationProgress,
): Promise<PictureConversationFeedback> {
  reportProgress?.({
    completedMetricIds: [],
    stage: "reading",
    totalMetrics: 0,
  });
  logAssessmentProgress("feedback service started", {
    pictureFilename: input.pictureFilename,
    turnCount: input.turns.length,
  });
  const pictureDescription =
    pictureDescriptions[input.pictureFilename].description;
  logAssessmentProgress("trusted picture description loaded", {
    pictureFilename: input.pictureFilename,
  });
  const assessment = await assessPictureConversationMetricsIndividually(
    {
      conversationMode: input.conversationMode,
      pictureDescription,
      turns: input.turns,
    },
    {
      assessMetric: (metricId, assessmentInput) =>
        assessMetricWithProviderFallback(metricId, assessmentInput, {
          assessWithGemini: assessMetricWithGemini,
          assessWithOpenAi: assessMetricWithOpenAi,
        }),
      providerName: "OpenAI with Gemini fallback",
    },
    reportProgress,
  );
  logAssessmentProgress("provider assessment completed", {
    assessedMetricCount: assessment.metrics.filter(
      (metric) => metric.status === "assessed",
    ).length,
  });

  const feedback = createPictureConversationFeedback(assessment);
  logAssessmentProgress("learner feedback assembled", {
    hasNextConversationPrompt: Boolean(feedback.nextConversationPrompt),
  });

  return feedback;
}
