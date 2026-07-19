import { NextResponse } from "next/server";

import { logAssessmentProgress } from "@/features/assessment/assessment-progress-log";
import { assessSubmittedPictureConversation } from "@/features/assessment/picture-conversation.service";
import { pictureConversationInputSchema } from "@/features/assessment/picture-conversation.schema";

export async function POST(request: Request) {
  logAssessmentProgress("feedback API request received");

  try {
    const input = pictureConversationInputSchema.parse(
      (await request.json()) as unknown,
    );
    logAssessmentProgress("feedback API request validated", {
      answerModes: [...new Set(input.turns.map((turn) => turn.answerMode))],
      pictureFilename: input.pictureFilename,
      turnCount: input.turns.length,
    });
    const result = await assessSubmittedPictureConversation(input);
    logAssessmentProgress("feedback API response ready", {
      assessedMetricCount: result.assessment.metrics.filter(
        (metric) => metric.status === "assessed",
      ).length,
    });

    return NextResponse.json(result);
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
}
