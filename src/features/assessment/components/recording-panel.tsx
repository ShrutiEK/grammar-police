import type { AudioRecording } from "@/features/recording/recording.types";

type RecordingPanelProperties = Readonly<{
  assessmentError: string | null;
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
    <aside className="flex flex-col justify-between rounded-2xl border-2 border-ink bg-white p-4 shadow-[5px_5px_0_#17213d] sm:rounded-3xl sm:p-5">
      <div>
        <p className="section-eyebrow mb-2 text-xs">
          Question {questionNumber} of 8
        </p>
        <h2 className="text-xl leading-snug font-bold text-ink sm:text-2xl">
          {question}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Answer in English by speaking or writing. Complete sentences help us
          understand your communication skills.
        </p>

        <div className="mt-4 flex flex-col items-center text-center">
          <button
            aria-label={isRecording ? "Stop recording" : "Start recording"}
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
            className="mt-3 min-h-8 text-xs leading-relaxed font-semibold text-muted sm:text-sm"
          >
            {hasResult ? "Your answer has been assessed." : statusMessage}
          </p>
        </div>

        {recording && (
          <div className="mt-3 rounded-xl border-2 border-support bg-[#f0fffb] p-3">
            <p className="text-xs font-bold text-ink">
              Recording saved · {recording.durationInSeconds} seconds
            </p>
            <audio
              className="mt-2 h-9 w-full"
              controls
              src={recording.audioUrl}
            />
          </div>
        )}

        {!recording && (
          <div className="my-3 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-ink/20" />
            <span className="text-xs font-bold text-muted uppercase">
              or write
            </span>
            <span className="h-px flex-1 bg-ink/20" />
          </div>
        )}

        {!recording && (
          <div>
            <label
              className="text-sm font-bold text-ink"
              htmlFor="written-answer"
            >
              Your answer
            </label>
            <textarea
              className="mt-1.5 min-h-20 w-full resize-y rounded-xl border-2 border-ink bg-canvas p-3 text-sm text-ink outline-none focus:ring-4 focus:ring-accent-soft disabled:cursor-not-allowed disabled:opacity-65 sm:min-h-24"
              disabled={isAnalyzing || hasResult || isRecording}
              id="written-answer"
              maxLength={5000}
              onChange={(event) => onWrittenAnswerChange(event.target.value)}
              placeholder="Type your answer in English…"
              value={writtenAnswer}
            />
          </div>
        )}
      </div>

      {recording && !hasResult && (
        <button
          className="primary-button mt-4 w-full cursor-pointer"
          disabled={isAnalyzing}
          onClick={onAnalyzeRecording}
          type="button"
        >
          {isTranscribingLongRecording
            ? "Transcribing your recording…"
            : isAnalyzing
              ? "Analyzing your English…"
              : "Submit spoken answer"}
        </button>
      )}

      {!recording && !hasResult && (
        <button
          className="primary-button mt-4 w-full cursor-pointer"
          disabled={isAnalyzing || !hasWrittenAnswer}
          onClick={onSubmitWrittenAnswer}
          type="button"
        >
          {isAnalyzing ? "Analyzing your English…" : "Submit written answer"}
        </button>
      )}

      {assessmentError && (
        <p
          className="mt-4 rounded-xl border-2 border-[#ff8b7b] bg-[#fff0ed] p-3 text-sm font-semibold text-ink"
          role="alert"
        >
          {assessmentError}
        </p>
      )}
    </aside>
  );
}
