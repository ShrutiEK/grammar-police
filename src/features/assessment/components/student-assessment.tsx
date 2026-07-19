"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { saveLessonAssessment } from "@/features/lesson/lesson-assessment-storage";
import { picturePromptsByFilename } from "@/features/picture-prompt/picture-prompt.data";
import { useAudioRecorder } from "@/features/recording/use-audio-recorder";
import type { PictureFilename } from "@/picture-descriptions/picture-descriptions.data";

import { requestStudentAssessment } from "../assessment.client";
import { logAssessmentProgress } from "../assessment-progress-log";
import { createCumulativePictureAssessment } from "../cumulative-picture-assessment";
import { createPictureConversationInput } from "../create-picture-conversation-input";
import {
  archivePictureAssessment,
  loadPictureAssessmentHistory,
  mergePictureAssessmentAttempts,
  type PictureAssessmentAttempt,
} from "../picture-assessment-history";
import { requestPictureConversationFeedback } from "../picture-conversation.client";
import {
  loadPictureConversationFeedback,
  loadPictureConversationFeedbackForInput,
  savePictureConversationFeedback,
} from "../picture-conversation-storage";
import type {
  PictureConversationFeedback,
  PictureConversationProgress,
} from "../picture-conversation.schema";
import { getRecordingStatusMessage } from "../recording-status";
import {
  ASSESSMENT_CHECKPOINTS,
  MAX_QUESTIONS,
  useAssessmentSession,
} from "../use-assessment-session";
import {
  AssessmentResults,
  type AssessmentCtaAction,
} from "./assessment-results";
import { ConversationHistory } from "./conversation-history";
import { PictureConversationResults } from "./picture-conversation-results";
import { PicturePromptCard } from "./picture-prompt-card";
import { RecordingPanel } from "./recording-panel";

type StudentAssessmentProperties = Readonly<{
  initialPictureFilename: PictureFilename;
}>;

export function StudentAssessment({
  initialPictureFilename,
}: StudentAssessmentProperties) {
  const router = useRouter();
  const { recording, recordingState, startRecording, stopRecording, reset } =
    useAudioRecorder();
  const { session, recordResult, advanceToNextQuestion, resetSession } =
    useAssessmentSession(initialPictureFilename);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PictureConversationFeedback | null>(
    null,
  );
  const [assessmentHistory, setAssessmentHistory] = useState<
    PictureAssessmentAttempt[]
  >(() =>
    typeof window === "undefined" ? [] : loadPictureAssessmentHistory(),
  );
  const [feedbackProgress, setFeedbackProgress] =
    useState<PictureConversationProgress | null>(null);
  const [, setLearningHandoffMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribingLongRecording, setIsTranscribingLongRecording] =
    useState(false);
  const [pendingCtaAction, setPendingCtaAction] =
    useState<AssessmentCtaAction | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");

  useEffect(() => {
    // Migrates feedback saved by the earlier sessionStorage version.
    loadPictureConversationFeedback();
  }, []);

  const currentPrompt =
    picturePromptsByFilename[session.selectedPictureFilename];
  const currentTurn = session.questionsAndAnswers.at(-1)!;
  const currentResult =
    currentTurn.answer && currentTurn.assessment
      ? { transcript: currentTurn.answer, assessment: currentTurn.assessment }
      : null;
  const isCheckpoint = ASSESSMENT_CHECKPOINTS.some(
    (checkpoint) => checkpoint === session.questionsAndAnswers.length,
  );

  function resetAssessment() {
    logAssessmentProgress("new assessment requested");
    resetSession();
    setAssessmentError(null);
    setFeedback(null);
    setFeedbackProgress(null);
    setLearningHandoffMessage(null);
    setIsTranscribingLongRecording(false);
    setPendingCtaAction(null);
    setWrittenAnswer("");
    reset();
    logAssessmentProgress("new assessment ready");
  }

  function archiveCurrentAssessment() {
    if (!feedback) {
      return assessmentHistory;
    }

    return archivePictureAssessment({
      feedback,
      input: createPictureConversationInput(session),
    });
  }

  function startNewPicture() {
    setAssessmentHistory(archiveCurrentAssessment());
    resetAssessment();
  }

  function continueToNextQuestion() {
    advanceToNextQuestion();
    setAssessmentError(null);
    setWrittenAnswer("");
    setIsTranscribingLongRecording(false);
    reset();
  }

  async function prepareNextQuestion() {
    if (pendingCtaAction) {
      return;
    }

    logAssessmentProgress("continue conversation requested", {
      currentQuestionNumber: currentTurn.number,
    });
    setPendingCtaAction("continue");

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 300);
    });

    continueToNextQuestion();
    setPendingCtaAction(null);
    logAssessmentProgress("next question ready", {
      nextQuestionNumber: currentTurn.number + 1,
    });
  }

  async function showConversationFeedback() {
    if (pendingCtaAction) {
      return;
    }

    logAssessmentProgress("feedback requested", {
      pictureFilename: session.selectedPictureFilename,
      turnCount: session.questionsAndAnswers.length,
    });
    setAssessmentError(null);
    setPendingCtaAction("feedback");
    setFeedbackProgress({
      completedMetricIds: [],
      stage: "reading",
      totalMetrics: 0,
    });

    try {
      logAssessmentProgress("building feedback input");
      const input = createPictureConversationInput(session);
      logAssessmentProgress("checking feedback cache");
      const savedFeedback = loadPictureConversationFeedbackForInput(input);

      if (savedFeedback) {
        logAssessmentProgress("matching feedback found in cache");
        setFeedback(savedFeedback);
        return;
      }

      logAssessmentProgress("no matching feedback found; requesting analysis");
      const response = await requestPictureConversationFeedback(input, {
        onProgress: setFeedbackProgress,
      });

      if (response.status === "retry_later") {
        logAssessmentProgress("feedback provider asked learner to retry later");
        setAssessmentError(response.message);
        return;
      }

      logAssessmentProgress("feedback received; saving result", {
        assessedMetricCount: response.assessment.metrics.filter(
          (metric) => metric.status === "assessed",
        ).length,
      });
      savePictureConversationFeedback(input, response);
      setFeedback(response);
      logAssessmentProgress("feedback displayed");
    } catch (error) {
      logAssessmentProgress("feedback request failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setAssessmentError(
        "We couldn’t finish your feedback right now. Please try again in a moment.",
      );
    } finally {
      setFeedbackProgress(null);
      setPendingCtaAction(null);
      logAssessmentProgress("feedback request finished");
    }
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
    logAssessmentProgress("answer assessment requested", {
      answerMode,
      questionNumber: currentTurn.number,
    });

    try {
      const conversationContext = session.questionsAndAnswers
        .filter((turn) => turn.answer !== null && turn.assessment !== null)
        .map((turn) => ({
          number: turn.number,
          question: turn.question,
          answer: turn.answer!,
          questionType: turn.questionType ?? "picture_follow_up",
          isValid:
            turn.assessment!.isGrounded &&
            turn.assessment!.isRelevantToFocus &&
            !turn.assessment!.languageWarning,
        }));
      const result = await requestStudentAssessment(
        {
          audioBlob: answerMode === "spoken" ? recording?.audioBlob : undefined,
          audioDurationInSeconds:
            answerMode === "spoken" ? recording?.durationInSeconds : undefined,
          writtenAnswer: answerMode === "written" ? writtenAnswer : undefined,
          pictureFilename: session.selectedPictureFilename,
          currentQuestion: currentTurn.question,
          currentQuestionType: currentTurn.questionType ?? "picture_follow_up",
          focusTopic: session.focusTopic,
          conversationContext,
        },
        {
          onBatchTranscriptionPending: () => {
            logAssessmentProgress("long recording transcription is pending", {
              questionNumber: currentTurn.number,
            });
            setIsTranscribingLongRecording(true);
          },
        },
      );
      logAssessmentProgress("answer assessment received", {
        questionNumber: currentTurn.number,
      });
      recordResult(
        result,
        answerMode,
        answerMode === "spoken" ? (recording?.durationInSeconds ?? null) : null,
      );
      logAssessmentProgress("answer assessment saved", {
        questionNumber: currentTurn.number,
      });
    } catch (error) {
      logAssessmentProgress("answer assessment failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        questionNumber: currentTurn.number,
      });
      setAssessmentError(
        error instanceof Error
          ? error.message
          : "We could not assess that answer. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
      setIsTranscribingLongRecording(false);
      logAssessmentProgress("answer assessment request finished", {
        questionNumber: currentTurn.number,
      });
    }
  }

  if (feedback) {
    const currentAttempt = {
      feedback,
      input: createPictureConversationInput(session),
    } satisfies PictureAssessmentAttempt;
    const cumulativeAttempts = mergePictureAssessmentAttempts([
      ...assessmentHistory,
      currentAttempt,
    ]);
    const cumulativeAssessment =
      createCumulativePictureAssessment(cumulativeAttempts);

    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-3 py-4 sm:px-5 sm:py-6">
        <section className="mx-auto max-w-4xl space-y-4">
          <PictureConversationResults
            assessment={cumulativeAssessment}
            canContinueConversation={
              session.questionsAndAnswers.length < MAX_QUESTIONS
            }
            nextConversationPrompt={
              currentTurn.assessment?.nextQuestion ||
              feedback.nextConversationPrompt
            }
            pictureCount={cumulativeAttempts.length}
            hasSpokenAnswers={session.questionsAndAnswers.some(
              (turn) => turn.answerMode === "spoken",
            )}
            hasWrittenAnswers={session.questionsAndAnswers.some(
              (turn) => turn.answerMode === "written",
            )}
            onContinueConversation={() => {
              setFeedback(null);
              continueToNextQuestion();
            }}
            onContinueLearning={() => {
              try {
                saveLessonAssessment(feedback.assessment);
                router.push("/lesson");
              } catch {
                setAssessmentError(
                  "We couldn’t prepare your lesson from this feedback. Please try again.",
                );
              }
              archiveCurrentAssessment();
              setLearningHandoffMessage(
                "Your cumulative feedback is saved and ready for the learning activity to use.",
              );
            }}
            onStartNewAssessment={startNewPicture}
          />
          {assessmentError && (
            <p
              className="rounded-2xl border-2 border-[#b96a00] bg-[#fff5dc] p-5 text-ink"
              role="alert"
            >
              {assessmentError}
            </p>
          )}
        </section>
      </main>
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
            feedbackProgress={feedbackProgress}
            hasResult={currentResult !== null}
            isAnalyzing={isAnalyzing}
            isTranscribingLongRecording={isTranscribingLongRecording}
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
            assessment={currentResult.assessment}
            isCheckpoint={isCheckpoint}
            isFinalQuestion={
              session.questionsAndAnswers.length >= MAX_QUESTIONS
            }
            pendingAction={pendingCtaAction}
            onContinue={prepareNextQuestion}
            onShowFeedback={showConversationFeedback}
          />
        )}

        <ConversationHistory turns={session.questionsAndAnswers} />
      </section>
    </main>
  );
}
