import type {
  AssessableMetricId,
  PictureConversationAssessmentInput,
  PictureConversationMetricResult,
} from "./picture-conversation.schema";
import { logAssessmentProgress } from "./assessment-progress-log";

type AssessMetric = (
  metricId: AssessableMetricId,
  input: PictureConversationAssessmentInput,
) => Promise<PictureConversationMetricResult>;

type MetricAssessmentProviders = Readonly<{
  assessWithGemini: AssessMetric;
  assessWithOpenAi: AssessMetric;
}>;

function getErrorSummary(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

export async function assessMetricWithProviderFallback(
  metricId: AssessableMetricId,
  input: PictureConversationAssessmentInput,
  { assessWithGemini, assessWithOpenAi }: MetricAssessmentProviders,
) {
  try {
    return await assessWithOpenAi(metricId, input);
  } catch (openAiError) {
    logAssessmentProgress(
      "OpenAI metric failed semantic or structural validation; starting Gemini fallback",
      {
        errorName:
          openAiError instanceof Error ? openAiError.name : "UnknownError",
        metricId,
      },
    );
    console.error("OpenAI metric assessment failed; trying Gemini fallback.", {
      error: getErrorSummary(openAiError),
      metricId,
    });

    return assessWithGemini(metricId, input);
  }
}
