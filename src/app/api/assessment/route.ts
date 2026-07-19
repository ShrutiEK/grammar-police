import { NextResponse } from "next/server";
import { z } from "zod";

import { completeStudentAssessment } from "@/features/assessment/assessment.service";
import { pictureFilenameSchema } from "@/features/assessment/assessment-session.schema";
import { fallbackQuestionsByFilename } from "@/features/picture-prompt/picture-prompt.data";
import { pictureDescriptions } from "@/picture-descriptions/picture-descriptions.data";

const maximumAudioSizeInBytes = 10 * 1024 * 1024;

const conversationContextSchema = z
  .array(
    z.object({
      number: z.number().int().min(1).max(8),
      question: z.string().trim().min(1).max(500),
      answer: z.string().trim().min(1).max(5000),
    }),
  )
  .max(7);

function getTextField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseConversationContext(value: string) {
  try {
    return conversationContextSchema.safeParse(JSON.parse(value) as unknown);
  } catch {
    return conversationContextSchema.safeParse(null);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioValue = formData.get("audio");
    const audioFile = audioValue instanceof File ? audioValue : null;
    const writtenAnswer = getTextField(formData, "writtenAnswer");
    const pictureFilename = pictureFilenameSchema.safeParse(
      getTextField(formData, "pictureFilename"),
    );
    const currentQuestion = getTextField(formData, "currentQuestion");
    const focusTopic = getTextField(formData, "focusTopic") || null;
    const conversationContext = parseConversationContext(
      getTextField(formData, "conversationContext"),
    );

    if ((audioFile && writtenAnswer) || (!audioFile && !writtenAnswer)) {
      return NextResponse.json(
        { error: "Please submit either a recording or a written answer." },
        { status: 400 },
      );
    }

    if (audioFile && audioFile.size === 0) {
      return NextResponse.json(
        { error: "Please record some audio before continuing." },
        { status: 400 },
      );
    }

    if (audioFile && audioFile.size > maximumAudioSizeInBytes) {
      return NextResponse.json(
        { error: "That recording is too large. Please keep it under 10 MB." },
        { status: 413 },
      );
    }

    if (writtenAnswer.length > 5000) {
      return NextResponse.json(
        { error: "Please keep your written answer under 5,000 characters." },
        { status: 400 },
      );
    }

    if (!pictureFilename.success) {
      return NextResponse.json(
        { error: "The selected picture is not available." },
        { status: 400 },
      );
    }

    if (!currentQuestion || currentQuestion.length > 500) {
      return NextResponse.json(
        { error: "The assessment question is invalid." },
        { status: 400 },
      );
    }

    if (!conversationContext.success) {
      return NextResponse.json(
        { error: "The conversation history is invalid." },
        { status: 400 },
      );
    }

    const result = await completeStudentAssessment({
      audioFile,
      writtenAnswer: writtenAnswer || null,
      pictureDescription: pictureDescriptions[pictureFilename.data].description,
      fallbackQuestion: fallbackQuestionsByFilename[pictureFilename.data],
      currentQuestion,
      focusTopic,
      conversationContext: conversationContext.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Student assessment failed", error);
    return NextResponse.json(
      { error: "We could not assess that answer. Please try again." },
      { status: 500 },
    );
  }
}
