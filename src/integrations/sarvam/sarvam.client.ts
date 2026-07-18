import "server-only";

import { readServerEnvironment } from "@/config/environment";

const sarvamApiBaseUrl = "https://api.sarvam.ai";

export async function requestSarvam(path: string, init: RequestInit) {
  const response = await fetch(`${sarvamApiBaseUrl}${path}`, {
    ...init,
    headers: {
      "api-subscription-key": readServerEnvironment().SARVAM_API_KEY,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "No error body");
    console.error(
      `Sarvam API failed on ${path}: Status ${response.status}. Body: ${errorBody}`,
    );
    throw new Error(
      "The assessment service is temporarily unavailable. Please try again.",
    );
  }

  return response;
}
