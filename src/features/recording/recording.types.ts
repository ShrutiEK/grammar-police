export type AudioRecording = Readonly<{
  audioBlob: Blob;
  audioUrl: string;
  durationInSeconds: number;
}>;

export type RecordingState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "recorded"
  | "permission-denied"
  | "unsupported"
  | "error";
