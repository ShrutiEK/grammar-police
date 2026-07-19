import type {
  PictureConversationAssessment,
  PictureConversationAssessmentInput,
} from "./picture-conversation.schema";
import { logAssessmentProgress } from "./assessment-progress-log";

type AssessPictureConversation = (
  input: PictureConversationAssessmentInput,
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
) {
  logAssessmentProgress("Sarvam assessment started");

  try {
    const assessment = await assessWithSarvam(input);
    logAssessmentProgress("Sarvam assessment succeeded");
    return assessment;
  } catch (sarvamError) {
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
      const assessment = await assessWithOpenAi(input);
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
