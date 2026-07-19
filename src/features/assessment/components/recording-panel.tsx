import { useState } from "react";

import type { AudioRecording } from "@/features/recording/recording.types";

import type { PictureConversationProgress } from "../picture-conversation.schema";
import { FeedbackProgress } from "./feedback-progress";

type RecordingPanelProperties = Readonly<{
  assessmentError: string | null;
  feedbackProgress: PictureConversationProgress | null;
  hasResult: boolean;
  isAnalyzing: boolean;
  isTranscribingLongRecording: boolean;
  isPreparing: boolean;
  isRecording: boolean;
  question: string;
  recording: AudioRecording | null;
  statusMessage: string;
  writtenAnswer: string;
  onAnalyzeRecording: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmitWrittenAnswer: () => void;
  onWrittenAnswerChange: (answer: string) => void;
  conversationMode?: "picture" | "pari";
}>;

export function RecordingPanel({
  assessmentError,
  feedbackProgress,
  hasResult,
  isAnalyzing,
  isTranscribingLongRecording,
  isPreparing,
  isRecording,
  question,
  recording,
  statusMessage,
  writtenAnswer,
  onAnalyzeRecording,
  onStartRecording,
  onStopRecording,
  onSubmitWrittenAnswer,
  onWrittenAnswerChange,
  conversationMode = "picture",
}: RecordingPanelProperties) {
  const [answerMode, setAnswerMode] = useState<"spoken" | "written">("spoken");
  const hasWrittenAnswer = writtenAnswer.trim().length > 0;
  const canChangeAnswerMode =
    !recording && !hasResult && !isAnalyzing && !isRecording;

  return (
    <aside
      aria-labelledby={
        feedbackProgress ? "feedback-progress-title" : "recording-panel-title"
      }
      className="flex flex-col justify-between rounded-2xl border-2 border-ink bg-surface p-4 shadow-[5px_5px_0_#17213d] sm:rounded-3xl sm:p-5"
    >
      {feedbackProgress ? (
        <FeedbackProgress progress={feedbackProgress} />
      ) : (
        <>
          <div>
            <p className="section-eyebrow mb-2">
              Your next conversation prompt
            </p>
            <h2
              className="text-xl leading-snug font-bold text-ink sm:text-2xl"
              id="recording-panel-title"
            >
              {question}
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted">
              Speak or write in English. Complete sentences help us understand
              your ideas.
            </p>

            {!recording && !hasResult && (
              <div
                aria-label="Choose how to answer"
                className="answer-mode-switch mt-4"
                role="group"
              >
                <button
                  aria-pressed={answerMode === "spoken"}
                  className="answer-mode-option"
                  disabled={!canChangeAnswerMode}
                  onClick={() => setAnswerMode("spoken")}
                  type="button"
                >
                  <span aria-hidden="true">🎙</span> Speak
                </button>
                <button
                  aria-pressed={answerMode === "written"}
                  className="answer-mode-option"
                  disabled={!canChangeAnswerMode}
                  onClick={() => setAnswerMode("written")}
                  type="button"
                >
                  <span aria-hidden="true">✎</span> Write
                </button>
              </div>
            )}

            {(answerMode === "spoken" || recording) && (
              <div className="mt-5 flex flex-col items-center text-center">
                <div
                  className={`recording-orbit ${isRecording ? "is-listening" : ""}`}
                >
                  <span className="recording-ring recording-ring-one" />
                  <span className="recording-ring recording-ring-two" />
                  <button
                    aria-describedby="recording-status"
                    aria-label={
                      isRecording ? "Stop recording" : "Start recording"
                    }
                    aria-pressed={isRecording}
                    className={`recording-button ${
                      isRecording ? "is-recording" : ""
                    }`}
                    disabled={isPreparing || isAnalyzing || hasResult}
                    onClick={isRecording ? onStopRecording : onStartRecording}
                    type="button"
                  >
                    <span aria-hidden="true">{isRecording ? "■" : "🎙️"}</span>
                  </button>
                </div>
                {isRecording && (
                  <div
                    aria-hidden="true"
                    className="mt-4 flex h-7 items-center gap-1"
                  >
                    {Array.from({ length: 7 }, (_, index) => (
                      <span
                        className="sound-bar"
                        key={index}
                        style={{ animationDelay: `${index * 80}ms` }}
                      />
                    ))}
                  </div>
                )}
                <p
                  aria-live="polite"
                  className="mt-3 min-h-8 text-base leading-relaxed font-semibold text-muted"
                  id="recording-status"
                >
                  {hasResult ? "Your feedback is ready." : statusMessage}
                </p>
              </div>
            )}

            {recording && (
              <div className="mt-3 rounded-xl border-2 border-support bg-canvas p-3">
                <p
                  className="text-base font-bold text-ink"
                  id="recording-summary"
                >
                  Recording saved · {recording.durationInSeconds} seconds
                </p>
                <audio
                  aria-describedby="recording-summary"
                  aria-label="Review your recorded answer"
                  className="mt-2 h-9 w-full"
                  controls
                  src={recording.audioUrl}
                />
              </div>
            )}

            {!recording && answerMode === "written" && (
              <div className="mt-5 animate-[answer-in_280ms_ease-out]">
                <label
                  className="text-base font-bold text-ink"
                  htmlFor="written-answer"
                >
                  Your answer
                </label>
                <textarea
                  aria-describedby="written-answer-help"
                  className="mt-1.5 min-h-24 w-full resize-y rounded-xl border-2 border-ink bg-canvas p-3 text-base text-ink focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-65"
                  disabled={isAnalyzing || hasResult || isRecording}
                  id="written-answer"
                  maxLength={5000}
                  onChange={(event) =>
                    onWrittenAnswerChange(event.target.value)
                  }
                  placeholder={
                    conversationMode === "pari"
                      ? "Share your answer with Pari…"
                      : "Start with the detail that caught your eye…"
                  }
                  value={writtenAnswer}
                />
                <p
                  className="mt-2 text-base text-muted"
                  id="written-answer-help"
                >
                  {hasWrittenAnswer
                    ? "Great start. Add one more detail if you can."
                    : "A complete sentence is a perfect place to begin."}
                </p>
              </div>
            )}
          </div>

          {recording && !hasResult && (
            <button
              aria-busy={isAnalyzing}
              aria-describedby="recording-status"
              className="primary-button mt-4 w-full cursor-pointer"
              disabled={isAnalyzing}
              onClick={onAnalyzeRecording}
              type="button"
            >
              {isTranscribingLongRecording
                ? "Turning your recording into words…"
                : isAnalyzing
                  ? "Putting your feedback together…"
                  : "Share my recording"}
            </button>
          )}

          {!recording && !hasResult && answerMode === "written" && (
            <button
              aria-busy={isAnalyzing}
              className="primary-button mt-4 w-full cursor-pointer"
              disabled={isAnalyzing || !hasWrittenAnswer}
              onClick={onSubmitWrittenAnswer}
              type="button"
            >
              {isAnalyzing
                ? "Putting your feedback together…"
                : "Share my answer"}
            </button>
          )}

          {assessmentError && (
            <p
              className="mt-4 rounded-xl border-2 border-danger bg-canvas p-3 text-base font-semibold text-ink"
              role="alert"
            >
              {assessmentError}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
