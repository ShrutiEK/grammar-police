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

type AssessStudentEnglishInput = Readonly<{
  pictureDescription: string;
  transcript: string;
}>;

export async function assessStudentEnglish({
  pictureDescription,
  transcript,
}: AssessStudentEnglishInput) {
  const response = await requestSarvam("/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: createAssessmentPrompt({ pictureDescription, transcript }),
          role: "system",
        },
        {
          content: `Evaluate this transcript: ${transcript}`,
          role: "user",
        },
      ],
      model: "sarvam-30b",
      response_format: { type: "json_object" },
      temperature: 0.2,
      reasoning_effort: null,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const responseBody: unknown = await response.json();
  const [choice] = chatCompletionResponseSchema.parse(responseBody).choices;

  if (!choice) {
    throw new Error("The assessment service returned no result.");
  }

  const content = choice.message.content;
  const parsedContent: unknown = JSON.parse(content);

  return learnerAssessmentSchema.parse(parsedContent);
}
