import type {
  PictureConversationAssessment,
  PictureConversationAssessmentInput,
  PictureConversationProgress,
  ReportPictureConversationProgress,
} from "./picture-conversation.schema";
import { logAssessmentProgress } from "./assessment-progress-log";

type AssessPictureConversation = (
  input: PictureConversationAssessmentInput,
  reportProgress?: ReportPictureConversationProgress,
) => Promise<PictureConversationAssessment>;

type PictureConversationAssessmentProviders = Readonly<{
  assessWithOpenAi: AssessPictureConversation;
  assessWithSarvam: AssessPictureConversation;
}>;

function getErrorSummary(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

export async function assessWithProviderFallback(
  input: PictureConversationAssessmentInput,
  {
    assessWithOpenAi,
    assessWithSarvam,
  }: PictureConversationAssessmentProviders,
  reportProgress?: ReportPictureConversationProgress,
) {
  let totalMetrics = 0;
  const forwardProgress = (progress: PictureConversationProgress) => {
    totalMetrics = progress.totalMetrics;
    reportProgress?.(progress);
  };

  logAssessmentProgress("Sarvam assessment started");

  try {
    const assessment = await assessWithSarvam(input, forwardProgress);
    logAssessmentProgress("Sarvam assessment succeeded");
    return assessment;
  } catch (sarvamError) {
    reportProgress?.({
      completedMetricIds: [],
      stage: "retrying",
      totalMetrics,
    });
    logAssessmentProgress(
      "Sarvam assessment failed; starting OpenAI fallback",
      {
        errorName:
          sarvamError instanceof Error ? sarvamError.name : "UnknownError",
      },
    );
    console.error(
      "Sarvam picture-conversation assessment failed; trying OpenAI fallback.",
      getErrorSummary(sarvamError),
    );

    try {
      const assessment = await assessWithOpenAi(input, forwardProgress);
      logAssessmentProgress("OpenAI fallback assessment succeeded");
      return assessment;
    } catch (openAiError) {
      logAssessmentProgress("OpenAI fallback assessment failed", {
        errorName:
          openAiError instanceof Error ? openAiError.name : "UnknownError",
      });
      console.error(
        "Picture-conversation assessment failed with both providers.",
        {
          openAiError: getErrorSummary(openAiError),
          sarvamError: getErrorSummary(sarvamError),
        },
      );
      throw openAiError;
    }
  }
}
