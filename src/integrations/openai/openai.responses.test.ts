import { describe, expect, it } from "vitest";

import { parseOpenAiResponseOutput } from "./openai.responses";

describe("parseOpenAiResponseOutput", () => {
  it("parses structured output text", () => {
    expect(
      parseOpenAiResponseOutput({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: '{"prompt":"Choose."}' }],
          },
        ],
      }),
    ).toEqual({ prompt: "Choose." });
  });

  it("rejects incomplete responses", () => {
    expect(() =>
      parseOpenAiResponseOutput({ status: "incomplete", output: [] }),
    ).toThrow("did not complete");
  });
});
