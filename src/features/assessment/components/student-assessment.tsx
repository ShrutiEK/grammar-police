"use client";

import Link from "next/link";
import { useState } from "react";

import { picturePromptsByFilename } from "@/features/picture-prompt/picture-prompt.data";
import { useAudioRecorder } from "@/features/recording/use-audio-recorder";
import type { PictureFilename } from "@/picture-descriptions/picture-descriptions.data";

import { requestStudentAssessment } from "../assessment.client";
import { calculateCumulativeScores } from "../cumulative-assessment";
import { getRecordingStatusMessage } from "../recording-status";
import {
  ASSESSMENT_CHECKPOINTS,
  useAssessmentSession,
} from "../use-assessment-session";
import { AssessmentCompletion } from "./assessment-completion";
import { AssessmentResults } from "./assessment-results";
import { ConversationHistory } from "./conversation-history";
import { PicturePromptCard } from "./picture-prompt-card";
import { RecordingPanel } from "./recording-panel";

type StudentAssessmentProperties = Readonly<{
  initialPictureFilename: PictureFilename;
}>;

export function StudentAssessment({
  initialPictureFilename,
}: StudentAssessmentProperties) {
  const { recording, recordingState, startRecording, stopRecording, reset } =
    useAudioRecorder();
  const {
    session,
    recordResult,
    advanceToNextQuestion,
    completeSession,
    resetSession,
  } = useAssessmentSession(initialPictureFilename);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState("");

  const currentPrompt =
    picturePromptsByFilename[session.selectedPictureFilename];
  const currentTurn = session.questionsAndAnswers.at(-1)!;
  const currentResult =
    currentTurn.answer && currentTurn.assessment
      ? { transcript: currentTurn.answer, assessment: currentTurn.assessment }
      : null;
  const cumulativeScores = calculateCumulativeScores(
    session.questionsAndAnswers,
  );
  const isCheckpoint = ASSESSMENT_CHECKPOINTS.some(
    (checkpoint) => checkpoint === session.questionsAndAnswers.length,
  );

  function resetAssessment() {
    resetSession();
    setAssessmentError(null);
    setWrittenAnswer("");
    reset();
  }

  function continueToNextQuestion() {
    advanceToNextQuestion();
    setAssessmentError(null);
    setWrittenAnswer("");
    reset();
  }

  async function submitAnswer(answerMode: "spoken" | "written") {
    if (answerMode === "spoken" && !recording) {
      return;
    }

    if (answerMode === "written" && !writtenAnswer.trim()) {
      return;
    }

    setAssessmentError(null);
    setIsAnalyzing(true);

    try {
      const conversationContext = session.questionsAndAnswers
        .filter((turn) => turn.answer !== null)
        .map((turn) => ({
          number: turn.number,
          question: turn.question,
          answer: turn.answer!,
        }));
      const result = await requestStudentAssessment({
        audioBlob: answerMode === "spoken" ? recording?.audioBlob : undefined,
        writtenAnswer: answerMode === "written" ? writtenAnswer : undefined,
        pictureFilename: session.selectedPictureFilename,
        currentQuestion: currentTurn.question,
        focusTopic: session.focusTopic,
        conversationContext,
      });
      recordResult(result, answerMode);
    } catch (error) {
      setAssessmentError(
        error instanceof Error
          ? error.message
          : "We could not assess that answer. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (session.status === "completed") {
    return (
      <AssessmentCompletion
        prompt={currentPrompt}
        session={session}
        onReset={resetAssessment}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-3 py-4 sm:px-5 sm:py-6">
      <section className="mx-auto max-w-6xl space-y-4">
        <header className="flex items-center justify-between">
          <Link
            className="text-sm font-bold text-eyebrow underline-offset-4 hover:underline"
            href="/"
          >
            ← Back to home
          </Link>
          <p className="rounded-full border border-ink/20 bg-white/80 px-3 py-1 text-xs font-bold text-muted">
            English only
          </p>
        </header>

        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <PicturePromptCard prompt={currentPrompt} />
          <RecordingPanel
            assessmentError={assessmentError}
            hasResult={currentResult !== null}
            isAnalyzing={isAnalyzing}
            isPreparing={recordingState === "requesting-permission"}
            isRecording={recordingState === "recording"}
            question={currentTurn.question}
            questionNumber={currentTurn.number}
            recording={recording}
            statusMessage={getRecordingStatusMessage(recordingState)}
            writtenAnswer={writtenAnswer}
            onAnalyzeRecording={() => submitAnswer("spoken")}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onSubmitWrittenAnswer={() => submitAnswer("written")}
            onWrittenAnswerChange={setWrittenAnswer}
          />
        </div>

        {currentResult && (
          <AssessmentResults
            completedQuestionCount={session.questionsAndAnswers.length}
            cumulativeScores={cumulativeScores}
            isCheckpoint={isCheckpoint}
            result={currentResult}
            onContinue={continueToNextQuestion}
            onFinish={completeSession}
          />
        )}

        <ConversationHistory turns={session.questionsAndAnswers} />
      </section>
    </main>
  );
}
