"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { AudioRecording, RecordingState } from "./recording.types";

function isMediaRecordingSupported() {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    navigator.mediaDevices?.getUserMedia !== undefined
  );
}

function getRecordingMimeType() {
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }

  return undefined;
}

export function useAudioRecorder() {
  const [recording, setRecording] = useState<AudioRecording | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const chunksReference = useRef<Blob[]>([]);
  const recorderReference = useRef<MediaRecorder | null>(null);
  const recordingUrlReference = useRef<string | null>(null);
  const startedAtReference = useRef<number | null>(null);
  const streamReference = useRef<MediaStream | null>(null);

  const releaseMicrophone = useCallback(() => {
    streamReference.current?.getTracks().forEach((track) => track.stop());
    streamReference.current = null;
  }, []);

  useEffect(() => {
    return () => {
      releaseMicrophone();

      if (recordingUrlReference.current) {
        URL.revokeObjectURL(recordingUrlReference.current);
      }
    };
  }, [releaseMicrophone]);

  const startRecording = useCallback(async () => {
    if (!isMediaRecordingSupported()) {
      setRecordingState("unsupported");
      return;
    }

    if (recordingUrlReference.current) {
      URL.revokeObjectURL(recordingUrlReference.current);
      recordingUrlReference.current = null;
    }

    setRecording(null);
    setRecordingState("requesting-permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamReference.current = stream;
      chunksReference.current = [];

      const mimeType = getRecordingMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderReference.current = recorder;
      startedAtReference.current = Date.now();

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksReference.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const durationInSeconds = Math.max(
          1,
          Math.round(
            (Date.now() - (startedAtReference.current ?? Date.now())) / 1000,
          ),
        );
        const audioBlob = new Blob(chunksReference.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        recordingUrlReference.current = audioUrl;

        setRecording({ audioBlob, audioUrl, durationInSeconds });
        setRecordingState("recorded");
        releaseMicrophone();
      });

      recorder.start();
      setRecordingState("recording");
    } catch (error) {
      releaseMicrophone();
      setRecordingState(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "permission-denied"
          : "error",
      );
    }
  }, [releaseMicrophone]);

  const stopRecording = useCallback(() => {
    if (recorderReference.current?.state === "recording") {
      recorderReference.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setRecording(null);
    setRecordingState("idle");
  }, []);

  return { recording, recordingState, startRecording, stopRecording, reset };
}
