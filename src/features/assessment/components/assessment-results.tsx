import type { AssessmentResult } from "../assessment-response.schema";

type AssessmentResultsProperties = Readonly<{
  result: AssessmentResult;
  onContinue: () => void;
}>;

const scoreCards = [
  { key: "grammar_score", label: "Grammar", color: "bg-[#eef8ff]" },
  {
    key: "vocabulary_score",
    label: "Word Knowledge",
    color: "bg-[#f0fffb]",
  },
  {
    key: "communication_score",
    label: "Communication",
    color: "bg-[#fff5dc]",
  },
  {
    key: "pronunciation_score",
    label: "Pronunciation",
    color: "bg-[#ffe3e0]",
  },
] as const;

export function AssessmentResults({
  result,
  onContinue,
}: AssessmentResultsProperties) {
  const { assessment, transcript } = result;
  const improvementAreas = [
    ...assessment.grammatical_errors,
    ...assessment.vocabulary_errors,
  ];

  return (
    <section
      className="mt-7 space-y-6 rounded-[2rem] border-[3px] border-ink bg-white p-6 shadow-card sm:p-8"
      aria-labelledby="results-title"
    >
      <header>
        <p className="section-eyebrow">AI Diagnostics Report</p>
        <h2 className="text-3xl font-bold text-ink" id="results-title">
          Evaluation Complete! 🎉
        </h2>
      </header>

      <div className="rounded-2xl border-2 border-ink bg-[#f0fffb] p-4">
        <p className="mb-1 text-xs font-bold text-muted uppercase">
          1. Sarvam AI Transcript:
        </p>
        <p className="font-medium text-ink italic">
          &ldquo;{transcript}&rdquo;
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {scoreCards.map(({ key, label, color }) => (
          <div
            className={`rounded-2xl border-2 border-ink p-4 text-center shadow-[3px_3px_0_#17213d] ${color}`}
            key={key}
          >
            <p className="text-xs font-bold text-muted uppercase">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {assessment[key]}/100
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border-2 border-ink bg-[#eef8ff] p-5">
        <p className="text-xs font-bold text-[#2980b9] uppercase">
          2. Sarvam Diagnostic Engine:
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DiagnosticList
            emptyMessage="Perfect! No errors detected. 🎉"
            heading="Errors & Improvement Areas"
            headingColor="text-[#e74c3c]"
            items={improvementAreas}
          />
          <DiagnosticList
            emptyMessage="No mastered skills listed yet."
            heading="Mastered Skills"
            headingColor="text-[#2ecc71]"
            items={assessment.mastered_skills}
          />
        </div>

        <div className="mt-4 border-t-2 border-ink/10 pt-4 text-center">
          <p className="rounded-xl border border-ink bg-accent-soft p-4 text-lg font-bold text-ink shadow-[3px_3px_0_#17213d]">
            &ldquo;{assessment.child_friendly_feedback}&rdquo;
          </p>
        </div>
      </div>

      <button
        className="primary-button mt-6 w-full cursor-pointer border-2 border-ink bg-[#2ecc71] font-bold text-white shadow-[5px_5px_0_#17213d] transition-all hover:-translate-y-0.5 hover:bg-[#27ae60]"
        onClick={onContinue}
        type="button"
      >
        Continue to Next Level →
      </button>
    </section>
  );
}

type DiagnosticListProperties = Readonly<{
  emptyMessage: string;
  heading: string;
  headingColor: string;
  items: string[];
}>;

function DiagnosticList({
  emptyMessage,
  heading,
  headingColor,
  items,
}: DiagnosticListProperties) {
  return (
    <div>
      <h3 className={`mb-2 text-sm font-bold uppercase ${headingColor}`}>
        {heading}
      </h3>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
        {items.map((item, index) => (
          <li key={`${heading}-${index}`}>{item}</li>
        ))}
        {items.length === 0 && (
          <li className="list-none pl-0">{emptyMessage}</li>
        )}
      </ul>
    </div>
  );
}
