import Image from "next/image";
import Link from "next/link";

import { picturePrompts } from "@/features/picture-prompt/picture-prompt.data";

type AssessmentCompletionProperties = Readonly<{
  stars: number;
  onReset: () => void;
}>;

export function AssessmentCompletion({
  stars,
  onReset,
}: AssessmentCompletionProperties) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,var(--color-accent-soft)_0,transparent_24%),radial-gradient(circle_at_88%_78%,var(--color-support)_0,transparent_29%)] px-5 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto max-w-3xl space-y-6 rounded-[2rem] border-[3px] border-ink bg-white p-8 text-center shadow-card">
        <header>
          <p className="text-sm font-bold tracking-wider text-eyebrow uppercase">
            🏆 Roadmap Completed
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            You are a Speaking Champion!
          </h1>
          <p className="mt-3 text-muted">
            You completed all the speaking descriptions in this level and earned
            a total of {stars} stars!
          </p>
        </header>

        <div className="flex justify-center text-5xl tracking-widest text-[#ffbd3e]">
          {Array.from({ length: Math.min(stars, 5) }).map((_, index) => (
            <span className="inline-block animate-bounce" key={`star-${index}`}>
              ⭐
            </span>
          ))}
        </div>

        <div className="border-t-2 border-ink/10 pt-6">
          <h2 className="mb-4 text-lg font-bold text-ink">Missions Mastered</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {picturePrompts.map((prompt) => (
              <div
                className="flex flex-col justify-between overflow-hidden rounded-xl border-2 border-ink bg-canvas p-1 shadow-[3px_3px_0_#17213d]"
                key={prompt.title}
              >
                <Image
                  alt={prompt.alt}
                  className="aspect-[4/3] w-full rounded-lg border border-ink/10 object-cover"
                  height={100}
                  src={prompt.imageUrl}
                  width={130}
                />
                <p className="mt-1 truncate px-1 text-[10px] font-bold text-ink">
                  {prompt.title.split(": ")[1]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 pt-6 sm:flex-row">
          <button
            className="primary-button w-full cursor-pointer sm:w-auto"
            onClick={onReset}
            type="button"
          >
            Start New Roadmap
          </button>
          <Link
            className="primary-button inline-flex w-full cursor-pointer items-center justify-center bg-support no-underline hover:bg-[#a6dccc] sm:w-auto"
            href="/"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
