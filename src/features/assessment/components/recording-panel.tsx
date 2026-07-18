import type { AudioRecording } from "@/features/recording/recording.types";

type RecordingPanelProperties = Readonly<{
  assessmentError: string | null;
  hasResult: boolean;
  isAnalyzing: boolean;
  isPreparing: boolean;
  isRecording: boolean;
  level: number;
  recording: AudioRecording | null;
  statusMessage: string;
  onAnalyze: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}>;

export function RecordingPanel({
  assessmentError,
  hasResult,
  isAnalyzing,
  isPreparing,
  isRecording,
  level,
  recording,
  statusMessage,
  onAnalyze,
  onStartRecording,
  onStopRecording,
}: RecordingPanelProperties) {
  return (
    <aside className="flex flex-col justify-between rounded-[2rem] border-[3px] border-ink bg-white p-6 shadow-card sm:p-8">
      <div>
        <p className="section-eyebrow">Level {level} of 5</p>
        <h2 className="text-2xl font-bold text-ink">Tell your story</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Try to use complete sentences. Tell us what you see, who is there, and
          what is happening!
        </p>

        <div className="mt-8 flex flex-col items-center text-center">
          <button
            aria-label={isRecording ? "Stop recording" : "Start recording"}
            className={`grid size-24 place-items-center rounded-full border-[3px] border-ink text-4xl shadow-[5px_5px_0_#17213d] transition-all enabled:hover:-translate-y-1 enabled:active:translate-y-0 disabled:cursor-wait ${
              isRecording
                ? "animate-bounce bg-[#ff8b7b]"
                : "bg-[#ffbd3e] hover:bg-[#ffe39a]"
            }`}
            disabled={isPreparing || isAnalyzing || hasResult}
            onClick={isRecording ? onStopRecording : onStartRecording}
            type="button"
          >
            {isRecording ? "■" : "🎙️"}
          </button>
          <p
            aria-live="polite"
            className="mt-5 min-h-12 text-sm leading-relaxed font-semibold text-muted"
          >
            {hasResult
              ? "Check the feedback report below to advance!"
              : statusMessage}
          </p>
        </div>

        {recording && (
          <div className="mt-6 rounded-2xl border-2 border-support bg-[#f0fffb] p-4">
            <p className="text-xs font-bold text-ink">
              Recording saved · {recording.durationInSeconds} seconds
            </p>
            <audio className="mt-3 w-full" controls src={recording.audioUrl} />
          </div>
        )}
      </div>

      {recording && !hasResult && (
        <button
          className="primary-button mt-5 w-full cursor-pointer"
          disabled={isAnalyzing}
          onClick={onAnalyze}
          type="button"
        >
          {isAnalyzing ? "Analyzing your English…" : "Check my English"}
        </button>
      )}

      {assessmentError && (
        <p
          className="mt-5 rounded-xl border-2 border-[#ff8b7b] bg-[#fff0ed] p-3 text-sm font-semibold text-ink"
          role="alert"
        >
          {assessmentError}
        </p>
      )}
    </aside>
  );
}
