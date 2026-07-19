import "server-only";

import { z } from "zod";

import type { StudentRecordingTranscription } from "@/features/assessment/student-answer-provider.types";

import { requestSarvam, SarvamApiError } from "./sarvam.client";

const transcriptionResponseSchema = z.object({
  transcript: z.string().trim().min(1),
});

const batchJobCreatedSchema = z.object({
  job_id: z.string().trim().min(1),
});

const fileUrlSchema = z.object({
  file_url: z.url(),
});

const batchUploadUrlsSchema = z.object({
  upload_urls: z.record(z.string(), fileUrlSchema),
});

const batchJobStatusSchema = z.object({
  error_message: z.string().nullish(),
  job_details: z
    .array(
      z.object({
        error_message: z.string().nullish(),
        outputs: z
          .array(
            z.object({
              file_name: z.string().trim().min(1),
            }),
          )
          .default([]),
        state: z.string().nullish(),
      }),
    )
    .default([]),
  job_state: z.string().trim().min(1),
});

const batchDownloadUrlsSchema = z.object({
  download_urls: z.record(z.string(), fileUrlSchema),
});

const batchJobIdSchema = z.string().trim().min(1).max(200);

const synchronousMaximumDurationInSeconds = 30;
const transcriptionLanguageCode = "unknown";
const transcriptionMode = "codemix";
const transcriptionModel = "saaras:v3";

function getCleanAudio(audioFile: File) {
  // Strip codec metadata (e.g., ";codecs=opus") to ensure Sarvam accepts it.
  const mimeType = audioFile.type.split(";")[0] || "audio/webm";

  return {
    audioBlob: new Blob([audioFile], { type: mimeType }),
    mimeType,
  };
}

function getRecordingFilename(mimeType: string) {
  if (mimeType === "audio/wav" || mimeType === "audio/x-wav") {
    return "student-recording.wav";
  }

  if (mimeType === "audio/mpeg") {
    return "student-recording.mp3";
  }

  return "student-recording.webm";
}

async function requestSarvamJson(path: string, body: unknown) {
  const response = await requestSarvam(path, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return response.json() as Promise<unknown>;
}

function isOverSynchronousDurationLimit(error: unknown) {
  return (
    error instanceof SarvamApiError &&
    error.status === 400 &&
    /audio duration exceeds the maximum limit of 30 seconds/i.test(
      error.responseBody,
    )
  );
}

async function uploadToSarvam(
  uploadUrl: string,
  audioBlob: Blob,
  mimeType: string,
) {
  const headers = new Headers({ "Content-Type": mimeType });

  // Sarvam currently returns Azure Blob Storage URLs. This header is required
  // by Azure and is harmlessly omitted for another future storage provider.
  if (new URL(uploadUrl).hostname.endsWith("blob.core.windows.net")) {
    headers.set("x-ms-blob-type", "BlockBlob");
  }

  const response = await fetch(uploadUrl, {
    body: audioBlob,
    headers,
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error("We couldn’t upload that recording for transcription.");
  }
}

async function startBatchTranscription(audioFile: File) {
  const { audioBlob, mimeType } = getCleanAudio(audioFile);
  const filename = getRecordingFilename(mimeType);
  const jobBody = await requestSarvamJson("/speech-to-text/job/v1", {
    job_parameters: {
      language_code: transcriptionLanguageCode,
      mode: transcriptionMode,
      model: transcriptionModel,
    },
  });
  const job = batchJobCreatedSchema.parse(jobBody);
  const uploadBody = await requestSarvamJson(
    "/speech-to-text/job/v1/upload-files",
    { files: [filename], job_id: job.job_id },
  );
  const uploadUrls = batchUploadUrlsSchema.parse(uploadBody).upload_urls;
  const uploadUrl = uploadUrls[filename]?.file_url;

  if (!uploadUrl) {
    throw new Error(
      "The transcription service did not provide an upload link.",
    );
  }

  await uploadToSarvam(uploadUrl, audioBlob, mimeType);
  await requestSarvamJson(`/speech-to-text/job/v1/${job.job_id}/start`, {});

  return { jobId: job.job_id, status: "processing" } as const;
}

async function transcribeShortRecording(audioFile: File) {
  const requestBody = new FormData();
  const { audioBlob, mimeType } = getCleanAudio(audioFile);

  requestBody.append("file", audioBlob, getRecordingFilename(mimeType));
  // Detect language switches without translating the learner's words. Hindi
  // remains in Devanagari and English remains English in the same transcript.
  requestBody.append("language_code", transcriptionLanguageCode);
  requestBody.append("mode", transcriptionMode);
  requestBody.append("model", transcriptionModel);

  const response = await requestSarvam("/speech-to-text", {
    body: requestBody,
    method: "POST",
  });
  const responseBody: unknown = await response.json();

  return transcriptionResponseSchema.parse(responseBody).transcript;
}

export async function transcribeStudentRecording(
  audioFile: File,
  durationInSeconds?: number,
): Promise<StudentRecordingTranscription> {
  if (
    durationInSeconds &&
    durationInSeconds > synchronousMaximumDurationInSeconds
  ) {
    return startBatchTranscription(audioFile);
  }

  try {
    return {
      status: "completed",
      transcript: await transcribeShortRecording(audioFile),
    };
  } catch (error) {
    // The measured browser duration may be unavailable or just below the
    // boundary. Let Sarvam's definitive duration response select Batch too.
    if (isOverSynchronousDurationLimit(error)) {
      return startBatchTranscription(audioFile);
    }

    throw error;
  }
}

export async function getStudentRecordingTranscription(
  transcriptionJobId: string,
): Promise<StudentRecordingTranscription> {
  const jobId = batchJobIdSchema.parse(transcriptionJobId);
  const statusResponse = await requestSarvam(
    `/speech-to-text/job/v1/${jobId}/status`,
    { method: "GET" },
  );
  const jobStatus = batchJobStatusSchema.parse(
    (await statusResponse.json()) as unknown,
  );

  if (["Accepted", "Pending", "Running"].includes(jobStatus.job_state)) {
    return { jobId, status: "processing" };
  }

  const outputFilenames = jobStatus.job_details.flatMap((detail) =>
    detail.state === "Success"
      ? detail.outputs.map((output) => output.file_name)
      : [],
  );

  const firstOutputFilename = outputFilenames[0];

  if (jobStatus.job_state === "Failed" || !firstOutputFilename) {
    throw new Error(
      jobStatus.error_message ||
        "We couldn’t transcribe that recording. Please try again.",
    );
  }

  const downloadBody = await requestSarvamJson(
    "/speech-to-text/job/v1/download-files",
    { files: outputFilenames, job_id: jobId },
  );
  const downloadUrl =
    batchDownloadUrlsSchema.parse(downloadBody).download_urls[
      firstOutputFilename
    ]?.file_url;

  if (!downloadUrl) {
    throw new Error("The transcription service did not provide a transcript.");
  }

  const transcriptResponse = await fetch(downloadUrl);

  if (!transcriptResponse.ok) {
    throw new Error("We couldn’t download that transcript. Please try again.");
  }

  return {
    status: "completed",
    transcript: transcriptionResponseSchema.parse(
      (await transcriptResponse.json()) as unknown,
    ).transcript,
  };
}
