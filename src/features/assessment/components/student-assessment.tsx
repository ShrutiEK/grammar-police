"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { saveLessonAssessment } from "@/features/lesson/lesson-assessment-storage";
import {
  pictureFilenames,
  picturePromptsByFilename,
} from "@/features/picture-prompt/picture-prompt.data";
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
import { ConversationTrail } from "./conversation-trail";
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
  const {
    session,
    recordResult,
    advanceToNextQuestion,
    switchPicture,
    resetSession,
  } = useAssessmentSession(initialPictureFilename);
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
  const allConversationTurns = [
    ...(session.previousPictureSessions ?? []).flatMap(
      (pictureSession) => pictureSession.questionsAndAnswers,
    ),
    ...session.questionsAndAnswers,
  ];
  const viewedPictures = session.viewedPictureFilenames ?? [
    ...(session.previousPictureSessions ?? []).map(
      (pictureSession) => pictureSession.selectedPictureFilename,
    ),
    session.selectedPictureFilename,
  ];
  const hasUnseenPicture =
    new Set(viewedPictures).size < pictureFilenames.length;
  const isCheckpoint = ASSESSMENT_CHECKPOINTS.some(
    (checkpoint) => checkpoint === currentTurn.number,
  );
  const canContinueConversation =
    session.questionsAndAnswers.length < MAX_QUESTIONS;

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

    if (currentTurn.number >= MAX_QUESTIONS) {
      resetAssessment();
      return;
    }

    if (!hasUnseenPicture) {
      return;
    }

    switchPicture();
    setFeedback(null);
    setAssessmentError(null);
    setWrittenAnswer("");
    reset();
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

  async function changePictureDuringAssessment() {
    if (pendingCtaAction) {
      return;
    }

    setAssessmentError(null);
    setPendingCtaAction("change-picture");
    setFeedbackProgress({
      completedMetricIds: [],
      stage: "reading",
      totalMetrics: 0,
    });

    try {
      const input = createPictureConversationInput(session);
      const hasAssessableAnswer = input.turns.some(
        (turn) => !turn.languageWarning && turn.isRelevantToFocus,
      );

      if (!hasAssessableAnswer) {
        switchPicture();
        setWrittenAnswer("");
        reset();
        return;
      }

      const cachedFeedback = loadPictureConversationFeedbackForInput(input);
      let pictureFeedback = cachedFeedback;

      if (!pictureFeedback) {
        const response = await requestPictureConversationFeedback(input, {
          onProgress: setFeedbackProgress,
        });

        if (response.status === "retry_later") {
          setAssessmentError(response.message);
          return;
        }

        savePictureConversationFeedback(input, response);
        pictureFeedback = response;
      }

      const nextHistory = archivePictureAssessment({
        feedback: pictureFeedback,
        input,
      });
      setAssessmentHistory(nextHistory);
      switchPicture();
      setWrittenAnswer("");
      reset();
    } catch (error) {
      logAssessmentProgress("picture change failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setAssessmentError(
        "We couldn’t save this part of your assessment. Please try changing the picture again.",
      );
    } finally {
      setFeedbackProgress(null);
      setPendingCtaAction(null);
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

      // Normal turns flow straight into the next question. Checkpoints and the
      // final question keep the results card so the learner can choose to keep
      // talking or see their feedback.
      if (canContinueConversation && !isCheckpoint) {
        continueToNextQuestion();
        logAssessmentProgress("advanced to next question automatically", {
          nextQuestionNumber: currentTurn.number + 1,
        });
      }
    } catch (error) {
      logAssessmentProgress("answer assessment failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        questionNumber: currentTurn.number,
      });
      setAssessmentError(
        error instanceof Error
          ? error.message
          : "We couldn’t check that answer. Try sharing it again.",
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
        <section className="mx-auto max-w-6xl space-y-6">
          <PictureConversationResults
            assessment={cumulativeAssessment}
            canContinueConversation={currentTurn.number < MAX_QUESTIONS}
            canStartNewPicture={
              currentTurn.number >= MAX_QUESTIONS || hasUnseenPicture
            }
            nextConversationPrompt={
              currentTurn.assessment?.nextQuestion ||
              feedback.nextConversationPrompt
            }
            pictureCount={cumulativeAttempts.length}
            hasSpokenAnswers={cumulativeAttempts.some((attempt) =>
              attempt.input.turns.some((turn) => turn.answerMode === "spoken"),
            )}
            hasWrittenAnswers={cumulativeAttempts.some((attempt) =>
              attempt.input.turns.some((turn) => turn.answerMode === "written"),
            )}
            onContinueConversation={() => {
              setFeedback(null);
              continueToNextQuestion();
            }}
            onContinueLearning={() => {
              try {
                saveLessonAssessment(cumulativeAssessment);
                router.push("/lesson");
              } catch {
                setAssessmentError(
                  "We couldn’t prepare your lesson from this feedback. Please try again.",
                );
              }
              archiveCurrentAssessment();
              setLearningHandoffMessage(
                "Your next challenge will use what came through in these conversations.",
              );
            }}
            onStartNewAssessment={startNewPicture}
          />
          {assessmentError && (
            <p
              className="rounded-2xl border-2 border-eyebrow bg-accent-soft p-5 text-ink"
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
        <header className="flex justify-end">
          <p className="rounded-full border border-ink/20 bg-surface px-3 py-1 text-base font-bold text-muted">
            English only
          </p>
        </header>

        <ConversationTrail
          currentQuestionNumber={session.questionsAndAnswers.length}
        />

        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <PicturePromptCard
            canChangePicture={hasUnseenPicture && !currentResult}
            isChangeDisabled={
              isAnalyzing ||
              isTranscribingLongRecording ||
              recordingState === "recording" ||
              recordingState === "requesting-permission"
            }
            isChangingPicture={pendingCtaAction === "change-picture"}
            prompt={currentPrompt}
            onChangePicture={changePictureDuringAssessment}
          />
          <RecordingPanel
            assessmentError={assessmentError}
            feedbackProgress={feedbackProgress}
            hasResult={currentResult !== null}
            isAnalyzing={isAnalyzing}
            isTranscribingLongRecording={isTranscribingLongRecording}
            isPreparing={recordingState === "requesting-permission"}
            isRecording={recordingState === "recording"}
            question={currentTurn.question}
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
            canChangePicture={hasUnseenPicture}
            isCheckpoint={isCheckpoint}
            isFinalQuestion={!canContinueConversation}
            pendingAction={pendingCtaAction}
            onChangePicture={changePictureDuringAssessment}
            onContinue={prepareNextQuestion}
            onShowFeedback={showConversationFeedback}
          />
        )}

        <ConversationHistory turns={allConversationTurns} />
      </section>
    </main>
  );
}
