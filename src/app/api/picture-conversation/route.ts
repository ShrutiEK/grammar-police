import { NextResponse } from "next/server";

import { logAssessmentProgress } from "@/features/assessment/assessment-progress-log";
import { assessSubmittedPictureConversation } from "@/features/assessment/picture-conversation.service";
import {
  pictureConversationInputSchema,
  type PictureConversationInput,
  type PictureConversationStreamEvent,
} from "@/features/assessment/picture-conversation.schema";

export async function POST(request: Request) {
  logAssessmentProgress("feedback API request received");

  let input: PictureConversationInput;

  try {
    input = pictureConversationInputSchema.parse(
      (await request.json()) as unknown,
    );
    logAssessmentProgress("feedback API request validated", {
      answerModes: [...new Set(input.turns.map((turn) => turn.answerMode))],
      pictureFilename: input.pictureFilename,
      turnCount: input.turns.length,
    });
  } catch (error) {
    logAssessmentProgress("feedback API request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    console.error("Picture conversation failed", error);
    return NextResponse.json(
      {
        message:
          "We couldn’t finish your feedback right now. Please try again in a moment.",
        status: "retry_later",
      },
      { status: 503 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sendEvent = (event: PictureConversationStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const result = await assessSubmittedPictureConversation(
          input,
          (progress) => {
            sendEvent({ progress, type: "progress" });
          },
        );
        logAssessmentProgress("feedback API response ready", {
          assessedMetricCount: result.assessment.metrics.filter(
            (metric) => metric.status === "assessed",
          ).length,
        });
        sendEvent({ response: result, type: "result" });
      } catch (error) {
        logAssessmentProgress("feedback API request failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
        console.error("Picture conversation failed", error);
        sendEvent({
          response: {
            message:
              "We couldn’t finish your feedback right now. Please try again in a moment.",
            status: "retry_later",
          },
          type: "result",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
