import { z } from "zod";

const openAiResponseSchema = z.object({
  status: z.string(),
  output: z.array(
    z.object({
      type: z.string(),
      content: z
        .array(
          z.object({
            type: z.string(),
            text: z.string().optional(),
            refusal: z.string().optional(),
          }),
        )
        .optional(),
    }),
  ),
});

export function parseOpenAiResponseOutput(responseBody: unknown) {
  const response = openAiResponseSchema.parse(responseBody);
  if (response.status !== "completed") {
    throw new Error(`OpenAI did not complete the lesson response.`);
  }

  for (const output of response.output) {
    for (const content of output.content ?? []) {
      if (content.type === "refusal") {
        throw new Error("OpenAI declined to create this lesson exercise.");
      }

      if (content.type === "output_text" && content.text) {
        return JSON.parse(content.text) as unknown;
      }
    }
  }

  throw new Error("OpenAI returned no lesson exercise.");
}
