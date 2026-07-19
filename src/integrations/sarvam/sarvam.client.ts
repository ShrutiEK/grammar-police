import "server-only";

import { readServerEnvironment } from "@/config/environment";

const sarvamApiBaseUrl = "https://api.sarvam.ai";

export class SarvamApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly responseBody: string,
  ) {
    super(
      "The assessment service is temporarily unavailable. Please try again.",
    );
    this.name = "SarvamApiError";
  }
}

export async function requestSarvam(path: string, init: RequestInit) {
  const apiKey = readServerEnvironment().SARVAM_API_KEY;

  if (!apiKey) {
    throw new Error("Sarvam is not configured.");
  }

  const response = await fetch(`${sarvamApiBaseUrl}${path}`, {
    ...init,
    headers: {
      "api-subscription-key": apiKey,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "No error body");
    console.error(
      `Sarvam API failed on ${path}: Status ${response.status}. Body: ${errorBody}`,
    );
    throw new SarvamApiError(response.status, errorBody);
  }

  return response;
}
