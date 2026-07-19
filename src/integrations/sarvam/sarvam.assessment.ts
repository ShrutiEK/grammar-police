import "server-only";

import { z } from "zod";

import { learnerAssessmentSchema } from "@/features/assessment/assessment.schema";
import { createAssessmentPrompt } from "@/prompts/assessment/create-assessment-prompt";

import { requestSarvam } from "./sarvam.client";

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
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        vocabulary: { type: "number", minimum: 1, maximum: 5 },
        grammar: { type: "number", minimum: 1, maximum: 5 },
        reasoning: { type: "number", minimum: 1, maximum: 5 },
        sentenceComplexity: { type: "number", minimum: 1, maximum: 5 },
        communication: { type: "number", minimum: 1, maximum: 5 },
      },
      required: [
        "vocabulary",
        "grammar",
        "reasoning",
        "sentenceComplexity",
        "communication",
      ],
    },
    feedback: { type: "string" },
    languageWarning: { type: "boolean" },
    languageHint: { type: "string" },
    isGrounded: { type: "boolean" },
    isRelevantToFocus: { type: "boolean" },
    focusTopic: { type: "string" },
    nextQuestion: { type: "string" },
  },
  required: [
    "scores",
    "feedback",
    "languageWarning",
    "languageHint",
    "isGrounded",
    "isRelevantToFocus",
    "focusTopic",
    "nextQuestion",
  ],
} as const;

type ConversationContextTurn = Readonly<{
  number: number;
  question: string;
  answer: string;
}>;

type AssessStudentEnglishInput = Readonly<{
  pictureDescription: string;
  transcript: string;
  currentQuestion: string;
  focusTopic: string | null;
  conversationContext: ReadonlyArray<ConversationContextTurn>;
}>;

export async function assessStudentEnglish(input: AssessStudentEnglishInput) {
  const response = await requestSarvam("/v1/chat/completions", {
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
      model: "sarvam-30b",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "picture_conversation_assessment",
          strict: true,
          schema: assessmentJsonSchema,
        },
      },
      temperature: 0.2,
      reasoning_effort: null,
      max_tokens: 1000,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const responseBody: unknown = await response.json();
  const [choice] = chatCompletionResponseSchema.parse(responseBody).choices;

  if (!choice) {
    throw new Error("The assessment service returned no result.");
  }

  const parsedContent: unknown = JSON.parse(
    choice.message.content
      .replaceAll("```json", "")
      .replaceAll("```", "")
      .trim(),
  );
  const assessment = learnerAssessmentSchema.parse(parsedContent);

  if (input.focusTopic) {
    return { ...assessment, focusTopic: input.focusTopic };
  }

  return assessment;
}
