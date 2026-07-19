import { describe, expect, it } from "vitest";

import {
  IncompleteModelResponseError,
  MalformedModelResponseError,
  parseStructuredChatCompletion,
} from "./structured-chat-completion";

describe("parseStructuredChatCompletion", () => {
  it("parses a completed structured response", () => {
    expect(
      parseStructuredChatCompletion(
        {
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: '```json\n{"learnerSummary":"Clear ideas"}\n```',
              },
            },
          ],
          usage: {
            completion_tokens: 24,
          },
        },
        "Sarvam",
      ),
    ).toEqual({ learnerSummary: "Clear ideas" });
  });

  it("reports a response stopped by the output limit before parsing it", () => {
    const partialContent = '{"learnerSummary":"Clear ideas","metrics":[';

    expect(() =>
      parseStructuredChatCompletion(
        {
          choices: [
            {
              finish_reason: "length",
              message: {
                content: partialContent,
              },
            },
          ],
          usage: {
            completion_tokens: 4096,
          },
        },
        "Sarvam",
      ),
    ).toThrow(
      expect.objectContaining({
        completionTokens: 4096,
        contentLength: partialContent.length,
        finishReason: "length",
        name: "IncompleteModelResponseError",
      }),
    );
  });

  it("identifies malformed JSON even when the provider reports stop", () => {
    expect(() =>
      parseStructuredChatCompletion(
        {
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: '{"learnerSummary":',
              },
            },
          ],
        },
        "Sarvam",
      ),
    ).toThrow(MalformedModelResponseError);
  });

  it("uses a distinct error type for incomplete responses", () => {
    expect(() =>
      parseStructuredChatCompletion(
        {
          choices: [
            {
              finish_reason: "content_filter",
              message: {
                content: "",
              },
            },
          ],
        },
        "OpenAI",
      ),
    ).toThrow(IncompleteModelResponseError);
  });
});
