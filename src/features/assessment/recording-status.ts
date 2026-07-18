import type { RecordingState } from "@/features/recording/recording.types";

export function getRecordingStatusMessage(recordingState: RecordingState) {
  switch (recordingState) {
    case "requesting-permission":
      return "Allow microphone access to begin.";
    case "recording":
      return "Listening now. Tell us what you see, then press stop.";
    case "recorded":
      return "Your recording is ready for analysis.";
    case "permission-denied":
      return "Microphone permission was blocked. Allow it in your browser settings and try again.";
    case "unsupported":
      return "This browser cannot record audio. Try a current browser with microphone support.";
    case "error":
      return "We could not start the microphone. Please try again.";
    default:
      return "Take a moment to look at the picture, then start speaking.";
  }
}
