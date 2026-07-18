import { NextResponse } from "next/server";

import { completeStudentAssessment } from "@/features/assessment/assessment.service";

const maximumAudioSizeInBytes = 10 * 1024 * 1024;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "We could not assess that recording. Please try again.";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const pictureDescription = formData.get("pictureDescription");

    if (!(audioFile instanceof File) || audioFile.size === 0) {
      return NextResponse.json(
        { error: "Please record some audio before continuing." },
        { status: 400 },
      );
    }

    if (audioFile.size > maximumAudioSizeInBytes) {
      return NextResponse.json(
        { error: "That recording is too large. Please keep it under 10 MB." },
        { status: 413 },
      );
    }

    if (
      typeof pictureDescription !== "string" ||
      pictureDescription.trim() === ""
    ) {
      return NextResponse.json(
        { error: "A picture description must be provided." },
        { status: 400 },
      );
    }

    const result = await completeStudentAssessment({
      audioFile,
      pictureDescription,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Student assessment failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
