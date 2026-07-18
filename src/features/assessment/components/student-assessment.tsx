"use client";

import Link from "next/link";
import { useState } from "react";

import { picturePrompts } from "@/features/picture-prompt/picture-prompt.data";
import { useAudioRecorder } from "@/features/recording/use-audio-recorder";

import { requestStudentAssessment } from "../assessment.client";
import { getRecordingStatusMessage } from "../recording-status";
import { useAssessmentSession } from "../use-assessment-session";
import { AssessmentCompletion } from "./assessment-completion";
import { AssessmentResults } from "./assessment-results";
import { PicturePromptCard } from "./picture-prompt-card";
import { RecordingPanel } from "./recording-panel";

const PROGRESS_PER_PICTURE = 20;

export function StudentAssessment() {
  const { recording, recordingState, startRecording, stopRecording, reset } =
    useAudioRecorder();
  const { session, recordResult, advanceToNextPicture, resetSession } =
    useAssessmentSession();
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activePromptIndex = Math.min(
    session.progress / PROGRESS_PER_PICTURE,
    picturePrompts.length - 1,
  );
  const currentPrompt = picturePrompts[activePromptIndex]!;

  function resetAssessment() {
    resetSession();
    setAssessmentError(null);
    reset();
  }

  function continueToNextPicture() {
    advanceToNextPicture();
    setAssessmentError(null);
    reset();
  }

  async function analyzeRecording() {
    if (!recording) {
      return;
    }

    setAssessmentError(null);
    setIsAnalyzing(true);

    try {
      const result = await requestStudentAssessment({
        audioBlob: recording.audioBlob,
        pictureDescription: currentPrompt.description,
      });
      recordResult(result);
    } catch (error) {
      setAssessmentError(
        error instanceof Error
          ? error.message
          : "We could not assess that recording. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (session.progress >= 100) {
    return (
      <AssessmentCompletion stars={session.stars} onReset={resetAssessment} />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-5 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <Link
            className="text-sm font-bold text-eyebrow underline-offset-4 hover:underline"
            href="/"
          >
            ← Back to home
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <PicturePromptCard prompt={currentPrompt} />
          <RecordingPanel
            assessmentError={assessmentError}
            hasResult={session.lastResult !== null}
            isAnalyzing={isAnalyzing}
            isPreparing={recordingState === "requesting-permission"}
            isRecording={recordingState === "recording"}
            level={activePromptIndex + 1}
            recording={recording}
            statusMessage={getRecordingStatusMessage(recordingState)}
            onAnalyze={analyzeRecording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>

        {session.lastResult && (
          <AssessmentResults
            result={session.lastResult}
            onContinue={continueToNextPicture}
          />
        )}
      </section>
    </main>
  );
}
