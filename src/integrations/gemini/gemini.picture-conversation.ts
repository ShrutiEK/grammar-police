import "server-only";

import { z } from "zod";

import { logAssessmentProgress } from "@/features/assessment/assessment-progress-log";
import {
  createPictureConversationProviderMetricSchema,
  parsePictureConversationProviderMetric,
  type AssessableMetricId,
  type PictureConversationAssessmentInput,
} from "@/features/assessment/picture-conversation.schema";
import { validateMetricFinding } from "@/features/assessment/validate-metric-finding";
import { createPictureConversationPrompt } from "@/prompts/assessment/create-picture-conversation-prompt";

import { createGeminiInteraction } from "./gemini.client";

const geminiAssessmentModel = "gemini-3.5-flash";

export async function assessMetricWithGemini(
  metricId: AssessableMetricId,
  input: PictureConversationAssessmentInput,
) {
  logAssessmentProgress("Gemini metric request is being prepared", {
    metricId,
    turnCount: input.turns.length,
  });
  const schema = z.toJSONSchema(
    createPictureConversationProviderMetricSchema(metricId),
  );
  const responseSchema = { ...schema };
  delete responseSchema.$schema;
  const interaction = await createGeminiInteraction({
    model: geminiAssessmentModel,
    prompt: createPictureConversationPrompt(metricId, input),
    responseSchema,
  });

  if (!interaction.output_text) {
    throw new Error("Gemini returned no assessment result.");
  }

  let responseBody: unknown;

  try {
    responseBody = JSON.parse(interaction.output_text) as unknown;
  } catch {
    throw new Error("Gemini returned an invalid assessment response.");
  }

  const metric = parsePictureConversationProviderMetric(metricId, responseBody);

  return validateMetricFinding(metric);
}
