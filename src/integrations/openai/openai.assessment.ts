import "server-only";

import { z } from "zod";

import {
  learnerAssessmentSchema,
  type LearnerAssessment,
} from "@/features/assessment/assessment.schema";
import type { AssessStudentEnglishInput } from "@/features/assessment/student-answer-provider.types";
import { createAssessmentPrompt } from "@/prompts/assessment/create-assessment-prompt";

import { requestOpenAi } from "./openai.client";

const chatCompletionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
});

const assessmentJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    languageWarning: { type: "boolean" },
    languageHint: { type: "string" },
    isGrounded: { type: "boolean" },
    isRelevantToFocus: { type: "boolean" },
    focusTopic: { type: "string" },
    nextQuestion: { type: "string" },
    nextQuestionType: {
      type: "string",
      enum: ["picture_follow_up", "personal_follow_up"],
    },
  },
  required: [
    "languageWarning",
    "languageHint",
    "isGrounded",
    "isRelevantToFocus",
    "focusTopic",
    "nextQuestion",
    "nextQuestionType",
  ],
} as const;

export async function assessStudentEnglishWithOpenAi(
  input: AssessStudentEnglishInput,
): Promise<LearnerAssessment> {
  const response = await requestOpenAi("/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: createAssessmentPrompt(input),
          role: "system",
        },
        {
          content: "Assess the latest learner answer now.",
          role: "user",
        },
      ],
      model: "gpt-5-mini",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "picture_conversation_answer_assessment",
          strict: true,
          schema: assessmentJsonSchema,
        },
      },
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const responseBody: unknown = await response.json();
  const [choice] = chatCompletionResponseSchema.parse(responseBody).choices;

  if (!choice) {
    throw new Error("OpenAI returned no answer assessment result.");
  }

  const parsedContent: unknown = JSON.parse(
    choice.message.content
      .replaceAll("```json", "")
      .replaceAll("```", "")
      .trim(),
  );
  const assessment = learnerAssessmentSchema.parse(parsedContent);

  return input.focusTopic
    ? { ...assessment, focusTopic: input.focusTopic }
    : assessment;
}
