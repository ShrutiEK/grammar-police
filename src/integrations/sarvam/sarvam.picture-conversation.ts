import "server-only";

import { z } from "zod";

import { logAssessmentProgress } from "@/features/assessment/assessment-progress-log";
import { assessPictureConversationMetricsIndividually } from "@/features/assessment/picture-conversation-metric-assessment";
import {
  createPictureConversationProviderMetricSchema,
  parsePictureConversationProviderMetric,
  type AssessableMetricId,
  type PictureConversationAssessment,
  type PictureConversationAssessmentInput,
} from "@/features/assessment/picture-conversation.schema";
import { parseStructuredChatCompletion } from "@/integrations/structured-chat-completion";
import { createPictureConversationPrompt } from "@/prompts/assessment/create-picture-conversation-prompt";

import { requestSarvam } from "./sarvam.client";

async function assessMetricWithSarvam(
  metricId: AssessableMetricId,
  input: PictureConversationAssessmentInput,
) {
  logAssessmentProgress("Sarvam metric request is being prepared", {
    metricId,
    turnCount: input.turns.length,
  });
  const response = await requestSarvam("/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: createPictureConversationPrompt(metricId, input),
          role: "system",
        },
      ],
      model: "sarvam-30b",
      reasoning_effort: null,
      response_format: {
        json_schema: {
          name: `picture_conversation_${metricId}`,
          schema: z.toJSONSchema(
            createPictureConversationProviderMetricSchema(metricId),
          ),
          strict: true,
        },
        type: "json_schema",
      },
      temperature: 0.2,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  logAssessmentProgress("Sarvam metric HTTP response received", {
    httpStatus: response.status,
    metricId,
  });
  const responseBody: unknown = await response.json();
  logAssessmentProgress("Sarvam metric response body decoded", { metricId });
  const providerMetric = parseStructuredChatCompletion(responseBody, "Sarvam");
  logAssessmentProgress("Sarvam metric structured response parsed", {
    metricId,
  });

  return parsePictureConversationProviderMetric(metricId, providerMetric);
}

export async function assessPictureConversation(
  input: PictureConversationAssessmentInput,
): Promise<PictureConversationAssessment> {
  return assessPictureConversationMetricsIndividually(input, {
    assessMetric: assessMetricWithSarvam,
    providerName: "Sarvam",
  });
}
