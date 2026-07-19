import {
  pictureConversationInputSchema,
  pictureConversationResponseSchema,
  pictureConversationStreamEventSchema,
  type PictureConversationInput,
  type PictureConversationProgress,
  type PictureConversationResponse,
} from "./picture-conversation.schema";
import { logAssessmentProgress } from "./assessment-progress-log";

type PictureConversationFeedbackOptions = Readonly<{
  onProgress?: (progress: PictureConversationProgress) => void;
}>;

function parseStreamLine(
  line: string,
  onProgress?: (progress: PictureConversationProgress) => void,
) {
  const event = pictureConversationStreamEventSchema.parse(
    JSON.parse(line) as unknown,
  );

  if (event.type === "progress") {
    onProgress?.(event.progress);
    return null;
  }

  return event.response;
}

async function readFeedbackStream(
  response: Response,
  onProgress?: (progress: PictureConversationProgress) => void,
) {
  if (!response.body) {
    throw new Error("The feedback response did not include a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bufferedText = "";
  let finalResponse: PictureConversationResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    bufferedText += decoder.decode(value, { stream: !done });
    const lines = bufferedText.split("\n");
    bufferedText = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim()) {
        finalResponse = parseStreamLine(line, onProgress) ?? finalResponse;
      }
    }

    if (done) {
      break;
    }
  }

  if (bufferedText.trim()) {
    finalResponse = parseStreamLine(bufferedText, onProgress) ?? finalResponse;
  }

  if (!finalResponse) {
    throw new Error("The feedback stream ended before returning a result.");
  }

  return finalResponse;
}

export async function requestPictureConversationFeedback(
  input: PictureConversationInput,
  { onProgress }: PictureConversationFeedbackOptions = {},
): Promise<PictureConversationResponse> {
  logAssessmentProgress("validating feedback request");
  pictureConversationInputSchema.parse(input);
  logAssessmentProgress("sending feedback request", {
    pictureFilename: input.pictureFilename,
    turnCount: input.turns.length,
  });
  const response = await fetch("/api/picture-conversation", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  logAssessmentProgress("feedback HTTP response received", {
    httpStatus: response.status,
  });

  if (response.headers.get("Content-Type")?.includes("application/x-ndjson")) {
    const streamedResponse = await readFeedbackStream(response, onProgress);
    logAssessmentProgress("feedback stream completed", {
      responseStatus: streamedResponse.status,
    });
    return streamedResponse;
  }

  const responseBody: unknown = await response.json();
  logAssessmentProgress("validating feedback response");

  const parsedResponse = pictureConversationResponseSchema.parse(responseBody);
  logAssessmentProgress("feedback response validated", {
    responseStatus: parsedResponse.status,
  });

  return parsedResponse;
}
