import { z } from "zod";

const structuredChatCompletionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable(),
        message: z.object({
          content: z.string().nullable(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({
      completion_tokens: z.number().int().nonnegative().optional(),
    })
    .nullish(),
});

export class IncompleteModelResponseError extends Error {
  constructor(
    provider: string,
    public readonly finishReason: string | null,
    public readonly contentLength: number,
    public readonly completionTokens?: number,
  ) {
    const completionDetails = [
      `finish reason: ${finishReason ?? "unknown"}`,
      `content length: ${contentLength}`,
      completionTokens === undefined
        ? null
        : `completion tokens: ${completionTokens}`,
    ]
      .filter(Boolean)
      .join(", ");

    super(
      `${provider} ended the assessment response before it was complete (${completionDetails}).`,
    );
    this.name = "IncompleteModelResponseError";
  }
}

export class MalformedModelResponseError extends Error {
  constructor(
    provider: string,
    public readonly contentLength: number,
    options: ErrorOptions,
  ) {
    super(
      `${provider} returned an invalid assessment response (content length: ${contentLength}).`,
      options,
    );
    this.name = "MalformedModelResponseError";
  }
}

export function parseStructuredChatCompletion(
  responseBody: unknown,
  provider: string,
) {
  const parsedResponse =
    structuredChatCompletionResponseSchema.parse(responseBody);
  const choice = parsedResponse.choices[0];

  if (!choice) {
    throw new Error(`${provider} returned no assessment result.`);
  }

  const content = choice.message.content || "";

  if (choice.finish_reason !== "stop") {
    throw new IncompleteModelResponseError(
      provider,
      choice.finish_reason,
      content.length,
      parsedResponse.usage?.completion_tokens,
    );
  }

  const cleanContent = content
    .replaceAll("```json", "")
    .replaceAll("```", "")
    .trim();

  try {
    return JSON.parse(cleanContent) as unknown;
  } catch (error) {
    throw new MalformedModelResponseError(provider, content.length, {
      cause: error,
    });
  }
}
