import "server-only";

import { assessPictureConversationWithOpenAi } from "@/integrations/openai/openai.picture-conversation";
import { assessPictureConversation } from "@/integrations/sarvam/sarvam.picture-conversation";
import { pictureDescriptions } from "@/picture-descriptions/picture-descriptions.data";

import { logAssessmentProgress } from "./assessment-progress-log";
import { createPictureConversationFeedback } from "./picture-conversation-feedback";
import { assessWithProviderFallback } from "./picture-conversation-provider-fallback";
import type {
  PictureConversationFeedback,
  PictureConversationInput,
} from "./picture-conversation.schema";

export async function assessSubmittedPictureConversation(
  input: PictureConversationInput,
): Promise<PictureConversationFeedback> {
  logAssessmentProgress("feedback service started", {
    pictureFilename: input.pictureFilename,
    turnCount: input.turns.length,
  });
  const pictureDescription =
    pictureDescriptions[input.pictureFilename].description;
  logAssessmentProgress("trusted picture description loaded", {
    pictureFilename: input.pictureFilename,
  });
  const assessment = await assessWithProviderFallback(
    {
      pictureDescription,
      turns: input.turns,
    },
    {
      assessWithOpenAi: assessPictureConversationWithOpenAi,
      assessWithSarvam: assessPictureConversation,
    },
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
