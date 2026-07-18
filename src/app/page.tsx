import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_15%_20%,var(--color-accent-soft)_0,transparent_28%),radial-gradient(circle_at_85%_80%,var(--color-support)_0,transparent_30%)] p-5 sm:p-8">
      <section className="assessment-card" aria-labelledby="page-title">
        <p className="section-eyebrow">Your personal English tutor</p>
        <h1
          id="page-title"
          className="text-[clamp(2.6rem,9vw,5rem)] leading-[0.98] font-bold tracking-tight"
        >
          Speak. Learn. Grow.
        </h1>
        <p className="mx-auto mt-6 mb-8 max-w-lg text-[clamp(1.1rem,3vw,1.35rem)] leading-relaxed">
          Describe a picture and get a lesson shaped around your English.
        </p>
        <Link
          className="primary-button inline-flex items-center justify-center font-bold text-center no-underline"
          href="/assessment"
        >
          Start English Assessment
        </Link>
        <p
          id="foundation-note"
          className="mt-4 text-sm text-muted"
          role="status"
        >
          Start with one short picture description.
        </p>
      </section>
    </main>
  );
}
