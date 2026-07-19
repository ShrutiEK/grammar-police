import "server-only";

import { readServerEnvironment } from "@/config/environment";

const openAiApiBaseUrl = "https://api.openai.com";

export class OpenAiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super("The assessment service is temporarily unavailable.");
    this.name = "OpenAiApiError";
  }
}

export async function requestOpenAi(path: string, init: RequestInit) {
  const apiKey = readServerEnvironment().OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI is not configured.");
  }

  const response = await fetch(`${openAiApiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "No error body");
    console.error(
      `OpenAI API failed on ${path}: Status ${response.status}. Body: ${errorBody}`,
    );
    throw new OpenAiApiError(response.status, errorBody);
  }

  return response;
}
