"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";

import { learnerAssessmentSchema } from "@/features/assessment/assessment.schema";
import { picturePrompts } from "@/features/picture-prompt/picture-prompt.data";
import type { RecordingState } from "@/features/recording/recording.types";
import { useAudioRecorder } from "@/features/recording/use-audio-recorder";

const completedAssessmentResponseSchema = z.object({
  assessment: learnerAssessmentSchema,
  transcript: z.string().trim().min(1),
});

type AssessmentResult = z.infer<typeof completedAssessmentResponseSchema>;

type SessionState = Readonly<{
  progress: number;
  stars: number;
  lastResult: AssessmentResult | null;
}>;

function getStatusMessage(recordingState: RecordingState) {
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

export function StudentAssessment() {
  const { recording, recordingState, startRecording, stopRecording, reset } =
    useAudioRecorder();

  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Unified Session State
  const [session, setSession] = useState<SessionState>({
    progress: 0,
    stars: 0,
    lastResult: null,
  });

  // Initialize progress and stars from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("speak2learn_session");
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        const parsedSession = z
          .object({
            progress: z.number().min(0).max(100),
            stars: z.number().min(0),
            lastResult: completedAssessmentResponseSchema.nullable(),
          })
          .safeParse(parsed);

        if (parsedSession.success) {
          setTimeout(() => {
            setSession(parsedSession.data);
          }, 0);
        }
      } catch (err) {
        console.error("Failed to parse saved session", err);
      }
    }
  }, []);

  const isRecording = recordingState === "recording";
  const isPreparing = recordingState === "requesting-permission";

  function resetProgress() {
    const nextSession: SessionState = {
      progress: 0,
      stars: 0,
      lastResult: null,
    };
    setSession(nextSession);
    setAssessmentError(null);
    reset();
    localStorage.removeItem("speak2learn_session");
  }

  function handleAwardStar(parsed: AssessmentResult) {
    setSession((prev) => {
      const nextSession: SessionState = {
        progress: prev.progress,
        stars: prev.stars + 1,
        lastResult: parsed,
      };
      localStorage.setItem("speak2learn_session", JSON.stringify(nextSession));
      return nextSession;
    });
  }

  function handleNextPicture() {
    setSession((prev) => {
      const nextSession: SessionState = {
        progress: prev.progress + 20,
        stars: prev.stars,
        lastResult: null,
      };
      localStorage.setItem("speak2learn_session", JSON.stringify(nextSession));
      return nextSession;
    });
    setAssessmentError(null);
    reset();
  }

  async function analyzeRecording() {
    if (!recording) {
      return;
    }

    setAssessmentError(null);
    setIsAnalyzing(true);

    try {
      const activePromptIndex = Math.min(
        session.progress / 20,
        picturePrompts.length - 1,
      );
      const currentPrompt = picturePrompts[activePromptIndex]!;

      const formData = new FormData();
      formData.append("audio", recording.audioBlob, "student-recording.webm");
      formData.append("pictureDescription", currentPrompt.description);

      const response = await fetch("/api/assessment", {
        body: formData,
        method: "POST",
      });
      const responseBody: unknown = await response.json();

      if (!response.ok) {
        const errorResponse = z
          .object({ error: z.string() })
          .safeParse(responseBody);
        throw new Error(
          errorResponse.success
            ? errorResponse.data.error
            : "We could not assess that recording. Please try again.",
        );
      }

      const parsed = completedAssessmentResponseSchema.parse(responseBody);
      handleAwardStar(parsed);
    } catch (error) {
      setAssessmentError(
        error instanceof Error
          ? error.message
          : "We could not assess that recording. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Active picture prompt selection
  const isCompleted = session.progress >= 100;
  const activePromptIndex = Math.min(
    session.progress / 20,
    picturePrompts.length - 1,
  );
  const currentPrompt = picturePrompts[activePromptIndex]!;

  if (isCompleted) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-5 py-8 sm:px-8 sm:py-12">
        <section className="mx-auto max-w-3xl rounded-[2rem] border-[3px] border-ink bg-white p-8 shadow-card text-center space-y-6">
          <header>
            <p className="text-sm font-bold uppercase tracking-wider text-eyebrow">
              🏆 Roadmap Completed
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink mt-2">
              You are a Speaking Champion!
            </h1>
            <p className="mt-3 text-muted">
              You completed all the speaking descriptions in this level and
              earned a total of {session.stars} stars!
            </p>
          </header>

          <div className="flex justify-center text-5xl tracking-widest text-[#ffbd3e]">
            {Array.from({ length: Math.min(session.stars, 5) }).map(
              (_, index) => (
                <span
                  key={`star-${index}`}
                  className="animate-bounce inline-block"
                >
                  ⭐
                </span>
              ),
            )}
          </div>

          <div className="border-t-2 border-ink/10 pt-6">
            <h2 className="text-lg font-bold text-ink mb-4">
              Missions Mastered
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {picturePrompts.map((prompt, index) => (
                <div
                  key={`thumb-${index}`}
                  className="overflow-hidden rounded-xl border-2 border-ink bg-canvas p-1 shadow-[3px_3px_0_#17213d] flex flex-col justify-between"
                >
                  <Image
                    alt={prompt.alt}
                    className="aspect-[4/3] w-full rounded-lg object-cover border border-ink/10"
                    height={100}
                    src={prompt.imageUrl}
                    width={130}
                  />
                  <p className="text-[10px] font-bold text-ink mt-1 truncate px-1">
                    {prompt.title.split(": ")[1]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={resetProgress}
              className="primary-button cursor-pointer w-full sm:w-auto"
              type="button"
            >
              Start New Roadmap
            </button>
            <Link
              href="/"
              className="primary-button bg-support hover:bg-[#a6dccc] cursor-pointer w-full sm:w-auto inline-flex items-center justify-center no-underline"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-5 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <Link
            className="text-sm font-bold text-eyebrow underline-offset-4 hover:underline"
            href="/"
          >
            ← Back to home
          </Link>
        </header>

        {/* Learning Roadmap Progress Tracker Card */}
        <div className="rounded-[2rem] border-[3px] border-ink bg-white p-6 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-eyebrow">
              🎯 Learning Road Map: Basic Descriptions
            </h2>
            <span className="text-sm font-bold text-ink bg-accent px-3 py-1 rounded-full border border-ink shadow-[2px_2px_0_#17213d]">
              ⭐ {session.stars} Stars
            </span>
          </div>

          <div className="mt-4 w-full bg-[#f0fffb] rounded-full h-5 overflow-hidden border-2 border-ink">
            <div
              style={{ width: `${session.progress}%` }}
              className="bg-[#2ecc71] h-full transition-all duration-1000 ease-out border-r border-ink"
            />
          </div>

          <div className="mt-3 flex justify-between text-xs font-bold text-muted">
            <span>Progress: {session.progress}%</span>
            <button
              onClick={resetProgress}
              className="text-[#e74c3c] hover:underline cursor-pointer"
              type="button"
            >
              Reset Progress
            </button>
          </div>
        </div>

        {/* Main Grid View */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Image Prompt Component */}
          <article className="overflow-hidden rounded-[2rem] border-[3px] border-ink bg-white shadow-card">
            <header className="border-b-2 border-ink bg-accent-soft px-6 py-5 sm:px-8">
              <p className="section-eyebrow mb-2">{currentPrompt.title}</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-ink">
                Speak about the picture
              </h1>
              <p className="mt-2 text-muted">{currentPrompt.instruction}</p>
            </header>
            <div className="p-5 sm:p-8">
              <Image
                alt={currentPrompt.alt}
                className="aspect-[4/3] w-full rounded-2xl object-cover border-2 border-ink"
                height={900}
                src={currentPrompt.imageUrl}
                width={1200}
                priority
              />
            </div>
          </article>

          {/* Recording & Mic Controller */}
          <aside className="rounded-[2rem] border-[3px] border-ink bg-white p-6 shadow-card sm:p-8 flex flex-col justify-between">
            <div>
              <p className="section-eyebrow">
                Level {activePromptIndex + 1} of 5
              </p>
              <h2 className="text-2xl font-bold text-ink">Tell your story</h2>
              <p className="mt-3 leading-relaxed text-muted text-sm">
                Try to use complete sentences. Tell us what you see, who is
                there, and what is happening!
              </p>

              <div className="mt-8 flex flex-col items-center text-center">
                <button
                  aria-label={
                    isRecording ? "Stop recording" : "Start recording"
                  }
                  className={`grid size-24 place-items-center rounded-full border-[3px] border-ink text-4xl shadow-[5px_5px_0_#17213d] transition-all enabled:hover:-translate-y-1 enabled:active:translate-y-0 disabled:cursor-wait ${
                    isRecording
                      ? "bg-[#ff8b7b] animate-bounce"
                      : "bg-[#ffbd3e] hover:bg-[#ffe39a]"
                  }`}
                  disabled={isPreparing || isAnalyzing || !!session.lastResult}
                  onClick={isRecording ? stopRecording : startRecording}
                  type="button"
                >
                  {isRecording ? "■" : "🎙️"}
                </button>
                <p
                  aria-live="polite"
                  className="mt-5 min-h-12 text-sm font-semibold leading-relaxed text-muted"
                >
                  {session.lastResult
                    ? "Check the feedback report below to advance!"
                    : getStatusMessage(recordingState)}
                </p>
              </div>

              {recording && (
                <div className="mt-6 rounded-2xl border-2 border-support bg-[#f0fffb] p-4">
                  <p className="text-xs font-bold text-ink">
                    Recording saved · {recording.durationInSeconds} seconds
                  </p>
                  <audio
                    className="mt-3 w-full"
                    controls
                    src={recording.audioUrl}
                  />
                </div>
              )}
            </div>

            {recording && !session.lastResult && (
              <button
                className="primary-button mt-5 w-full cursor-pointer"
                disabled={isAnalyzing}
                onClick={analyzeRecording}
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
        </div>

        {/* Results diagnostics card */}
        {session.lastResult && (
          <section
            className="mt-7 rounded-[2rem] border-[3px] border-ink bg-white p-6 shadow-card sm:p-8 space-y-6"
            aria-labelledby="results-title"
          >
            <div>
              <p className="section-eyebrow">AI Diagnostics Report</p>
              <h2 className="text-3xl font-bold text-ink" id="results-title">
                Evaluation Complete! 🎉
              </h2>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-[#f0fffb] p-4">
              <p className="text-xs text-muted font-bold uppercase mb-1">
                1. Sarvam AI Transcript:
              </p>
              <p className="text-ink font-medium italic">
                &ldquo;{session.lastResult.transcript}&rdquo;
              </p>
            </div>

            {/* Competency Metrics Row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border-2 border-ink bg-[#eef8ff] p-4 shadow-[3px_3px_0_#17213d] text-center">
                <p className="text-xs font-bold uppercase text-muted">
                  Grammar
                </p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {session.lastResult.assessment.grammar_score}/100
                </p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-[#f0fffb] p-4 shadow-[3px_3px_0_#17213d] text-center">
                <p className="text-xs font-bold uppercase text-muted">
                  Word Knowledge
                </p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {session.lastResult.assessment.vocabulary_score}/100
                </p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-[#fff5dc] p-4 shadow-[3px_3px_0_#17213d] text-center">
                <p className="text-xs font-bold uppercase text-muted">
                  Communication
                </p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {session.lastResult.assessment.communication_score}/100
                </p>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-[#ffe3e0] p-4 shadow-[3px_3px_0_#17213d] text-center">
                <p className="text-xs font-bold uppercase text-muted">
                  Pronunciation
                </p>
                <p className="mt-2 text-3xl font-extrabold text-ink">
                  {session.lastResult.assessment.pronunciation_score}/100
                </p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-ink bg-[#eef8ff] p-5 space-y-4">
              <p className="text-xs text-[#2980b9] font-bold uppercase">
                2. Sarvam Diagnostic Engine:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold uppercase text-[#e74c3c] mb-2">
                    Errors & Improvement Areas
                  </h3>
                  <ul className="text-sm text-muted list-disc pl-5 space-y-2">
                    {session.lastResult.assessment.grammatical_errors.map(
                      (error, index) => (
                        <li key={`gram-err-${index}`}>{error}</li>
                      ),
                    )}
                    {session.lastResult.assessment.vocabulary_errors.map(
                      (error, index) => (
                        <li key={`voc-err-${index}`}>{error}</li>
                      ),
                    )}
                    {session.lastResult.assessment.grammatical_errors.length ===
                      0 &&
                      session.lastResult.assessment.vocabulary_errors.length ===
                        0 && (
                        <li className="text-[#2ecc71] font-semibold list-none pl-0">
                          Perfect! No errors detected. 🎉
                        </li>
                      )}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase text-[#2ecc71] mb-2">
                    Mastered Skills
                  </h3>
                  <ul className="text-sm text-muted list-disc pl-5 space-y-2">
                    {session.lastResult.assessment.mastered_skills.map(
                      (skill, index) => (
                        <li key={`skill-${index}`}>{skill}</li>
                      ),
                    )}
                    {session.lastResult.assessment.mastered_skills.length ===
                      0 && (
                      <li className="list-none pl-0">
                        No mastered skills listed yet.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-4 border-t-2 border-ink/10 pt-4 text-center">
                <p className="text-lg font-bold text-ink bg-accent-soft p-4 rounded-xl border border-ink shadow-[3px_3px_0_#17213d]">
                  &ldquo;{session.lastResult.assessment.child_friendly_feedback}
                  &rdquo;
                </p>
              </div>
            </div>

            {/* Next Picture Trigger button */}
            <button
              onClick={handleNextPicture}
              className="primary-button mt-6 w-full cursor-pointer bg-[#2ecc71] hover:bg-[#27ae60] text-white border-2 border-ink font-bold shadow-[5px_5px_0_#17213d] transition-all hover:-translate-y-0.5"
              type="button"
            >
              Continue to Next Level →
            </button>
          </section>
        )}
      </section>
    </main>
  );
}
