import "server-only";

import { assessStudentEnglish } from "@/integrations/sarvam/sarvam.assessment";
import { transcribeStudentRecording } from "@/integrations/sarvam/sarvam.transcription";

export type CompletedAssessment = Readonly<{
  assessment: Awaited<ReturnType<typeof assessStudentEnglish>>;
  transcript: string;
}>;

type CompleteAssessmentInput = Readonly<{
  audioFile: File;
  pictureDescription: string;
}>;

export async function completeStudentAssessment({
  audioFile,
  pictureDescription,
}: CompleteAssessmentInput): Promise<CompletedAssessment> {
  const transcript = await transcribeStudentRecording(audioFile);

  if (!transcript) {
    throw new Error("We could not hear any speech in that recording.");
  }

  const assessment = await assessStudentEnglish({
    pictureDescription,
    transcript,
  });

  return { assessment, transcript };
}
