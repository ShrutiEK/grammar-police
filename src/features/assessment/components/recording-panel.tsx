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
  questionNumber: number;
  recording: AudioRecording | null;
  statusMessage: string;
  writtenAnswer: string;
  onAnalyzeRecording: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmitWrittenAnswer: () => void;
  onWrittenAnswerChange: (answer: string) => void;
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
  questionNumber,
  recording,
  statusMessage,
  writtenAnswer,
  onAnalyzeRecording,
  onStartRecording,
  onStopRecording,
  onSubmitWrittenAnswer,
  onWrittenAnswerChange,
}: RecordingPanelProperties) {
  const hasWrittenAnswer = writtenAnswer.trim().length > 0;

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
            <p className="section-eyebrow mb-2">Prompt {questionNumber} of 8</p>
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

            <div className="mt-4 flex flex-col items-center text-center">
              <button
                aria-describedby="recording-status"
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                aria-pressed={isRecording}
                className={`grid size-16 place-items-center rounded-full border-2 border-ink text-2xl shadow-[4px_4px_0_#17213d] transition-all enabled:hover:-translate-y-1 enabled:active:translate-y-0 disabled:cursor-wait sm:size-18 ${
                  isRecording
                    ? "animate-bounce bg-[#ff8b7b]"
                    : "bg-[#ffbd3e] hover:bg-[#ffe39a]"
                }`}
                disabled={
                  isPreparing || isAnalyzing || hasResult || hasWrittenAnswer
                }
                onClick={isRecording ? onStopRecording : onStartRecording}
                type="button"
              >
                {isRecording ? "■" : "🎙️"}
              </button>
              <p
                aria-live="polite"
                className="mt-3 min-h-8 text-base leading-relaxed font-semibold text-muted"
                id="recording-status"
              >
                {hasResult ? "Your feedback is ready." : statusMessage}
              </p>
            </div>

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

            {!recording && (
              <div className="my-3 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-ink/20" />
                <span className="text-base font-bold text-muted">or write</span>
                <span className="h-px flex-1 bg-ink/20" />
              </div>
            )}

            {!recording && (
              <div>
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
                  placeholder="For example: I can see people playing in a park."
                  value={writtenAnswer}
                />
                <p
                  className="mt-2 text-base text-muted"
                  id="written-answer-help"
                >
                  Use complete English sentences. Maximum 5,000 characters.
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

          {!recording && !hasResult && (
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
