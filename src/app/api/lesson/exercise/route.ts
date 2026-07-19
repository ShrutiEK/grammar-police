import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createAdaptiveExercise } from "@/features/lesson/lesson.service";

export async function POST(request: Request) {
  try {
    const requestBody: unknown = await request.json();
    return NextResponse.json(await createAdaptiveExercise(requestBody));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "The lesson request or generated exercise was invalid." },
        { status: 400 },
      );
    }

    console.error("Adaptive lesson generation failed", error);
    return NextResponse.json(
      { error: "We could not build the next challenge. Please try again." },
      { status: 503 },
    );
  }
}
