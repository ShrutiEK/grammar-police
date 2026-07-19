import type { LearnerAssessment, QuestionType } from "./assessment.schema";

export type ConversationContextTurn = Readonly<{
  number: number;
  question: string;
  answer: string;
  questionType: QuestionType;
  isValid: boolean;
}>;

export type AssessStudentEnglishInput = Readonly<{
  conversationMode?: "picture" | "pari";
  conversationTopic?: string | null;
  pictureDescription: string;
  transcript: string;
  currentQuestion: string;
  currentQuestionType: QuestionType;
  focusTopic: string | null;
  conversationContext: ReadonlyArray<ConversationContextTurn>;
}>;

export type AssessStudentEnglish = (
  input: AssessStudentEnglishInput,
) => Promise<LearnerAssessment>;

export type StudentRecordingTranscription =
  | Readonly<{
      status: "completed";
      transcript: string;
    }>
  | Readonly<{
      status: "processing";
      jobId: string;
    }>;

export type TranscribeStudentRecording = (
  audioFile: File,
  durationInSeconds?: number,
) => Promise<StudentRecordingTranscription>;
