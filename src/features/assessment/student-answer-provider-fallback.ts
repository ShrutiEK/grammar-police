import { logAssessmentProgress } from "./assessment-progress-log";
import type {
  AssessStudentEnglish,
  AssessStudentEnglishInput,
  TranscribeStudentRecording,
} from "./student-answer-provider.types";

type StudentAnswerProviders = Readonly<{
  assessWithOpenAi: AssessStudentEnglish;
  assessWithSarvam: AssessStudentEnglish;
  transcribeWithOpenAi: TranscribeStudentRecording;
  transcribeWithSarvam: TranscribeStudentRecording;
}>;

function getErrorSummary(error: unknown) {
  return error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error);
}

export async function transcribeStudentRecordingWithFallback(
  audioFile: File,
  durationInSeconds: number | undefined,
  providers: Pick<
    StudentAnswerProviders,
    "transcribeWithOpenAi" | "transcribeWithSarvam"
  >,
) {
  try {
    return await providers.transcribeWithSarvam(audioFile, durationInSeconds);
  } catch (sarvamError) {
    logAssessmentProgress(
      "Sarvam transcription failed; starting OpenAI fallback",
      {
        errorName:
          sarvamError instanceof Error ? sarvamError.name : "UnknownError",
      },
    );
    console.error(
      "Sarvam transcription failed; trying OpenAI fallback.",
      getErrorSummary(sarvamError),
    );

    return providers.transcribeWithOpenAi(audioFile, durationInSeconds);
  }
}

export async function assessStudentEnglishWithFallback(
  input: AssessStudentEnglishInput,
  providers: Pick<
    StudentAnswerProviders,
    "assessWithOpenAi" | "assessWithSarvam"
  >,
) {
  try {
    return await providers.assessWithSarvam(input);
  } catch (sarvamError) {
    logAssessmentProgress(
      "Sarvam answer evaluation failed; starting OpenAI fallback",
      {
        errorName:
          sarvamError instanceof Error ? sarvamError.name : "UnknownError",
      },
    );
    console.error(
      "Sarvam answer evaluation failed; trying OpenAI fallback.",
      getErrorSummary(sarvamError),
    );

    return providers.assessWithOpenAi(input);
  }
}
