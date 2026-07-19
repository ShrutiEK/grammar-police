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
  type ReportPictureConversationProgress,
} from "@/features/assessment/picture-conversation.schema";
import { parseStructuredChatCompletion } from "@/integrations/structured-chat-completion";
import { createPictureConversationPrompt } from "@/prompts/assessment/create-picture-conversation-prompt";

import { requestOpenAi } from "./openai.client";

const openAiAssessmentModel = "gpt-5-mini";

async function assessMetricWithOpenAi(
  metricId: AssessableMetricId,
  input: PictureConversationAssessmentInput,
) {
  logAssessmentProgress("OpenAI metric request is being prepared", {
    metricId,
    turnCount: input.turns.length,
  });
  const response = await requestOpenAi("/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: createPictureConversationPrompt(metricId, input),
          role: "system",
        },
      ],
      model: openAiAssessmentModel,
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
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  logAssessmentProgress("OpenAI metric HTTP response received", {
    httpStatus: response.status,
    metricId,
  });
  const responseBody: unknown = await response.json();
  logAssessmentProgress("OpenAI metric response body decoded", { metricId });
  const providerMetric = parseStructuredChatCompletion(responseBody, "OpenAI");
  logAssessmentProgress("OpenAI metric structured response parsed", {
    metricId,
  });

  return parsePictureConversationProviderMetric(metricId, providerMetric);
}

export async function assessPictureConversationWithOpenAi(
  input: PictureConversationAssessmentInput,
  reportProgress?: ReportPictureConversationProgress,
): Promise<PictureConversationAssessment> {
  return assessPictureConversationMetricsIndividually(
    input,
    {
      assessMetric: assessMetricWithOpenAi,
      providerName: "OpenAI",
    },
    reportProgress,
  );
}
