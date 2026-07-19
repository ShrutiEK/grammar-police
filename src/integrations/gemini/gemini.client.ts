import "server-only";

import { GoogleGenAI } from "@google/genai";

export async function createGeminiInteraction(
  input: Readonly<{
    model: string;
    prompt: string;
    responseSchema: Record<string, unknown>;
  }>,
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini is not configured.");
  }

  const client = new GoogleGenAI({ apiKey });

  return client.interactions.create({
    input: input.prompt,
    model: input.model,
    response_format: {
      mime_type: "application/json",
      schema: input.responseSchema,
      type: "text",
    },
  });
}
