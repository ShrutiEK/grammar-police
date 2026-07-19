import {
  pictureConversationInputSchema,
  pictureConversationResponseSchema,
  type PictureConversationInput,
  type PictureConversationResponse,
} from "./picture-conversation.schema";
import { logAssessmentProgress } from "./assessment-progress-log";

export async function requestPictureConversationFeedback(
  input: PictureConversationInput,
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
  const responseBody: unknown = await response.json();
  logAssessmentProgress("validating feedback response");

  const parsedResponse = pictureConversationResponseSchema.parse(responseBody);
  logAssessmentProgress("feedback response validated", {
    responseStatus: parsedResponse.status,
  });

  return parsedResponse;
}
