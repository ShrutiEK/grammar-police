import Image from "next/image";

import type { PicturePrompt } from "@/features/picture-prompt/picture-prompt.data";

type PicturePromptCardProperties = Readonly<{
  canChangePicture?: boolean;
  isChangeDisabled?: boolean;
  isChangingPicture?: boolean;
  onChangePicture?: () => void;
  onDmWithPari?: () => void;
  prompt: PicturePrompt;
}>;

export function PicturePromptCard({
  canChangePicture = false,
  isChangeDisabled = false,
  isChangingPicture = false,
  onChangePicture,
  onDmWithPari,
  prompt,
}: PicturePromptCardProperties) {
  return (
    <article className="overflow-hidden rounded-2xl border-2 border-ink bg-surface shadow-[5px_5px_0_#17213d] sm:rounded-3xl">
      <header className="border-b-2 border-ink bg-accent-soft px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="section-eyebrow mb-1">{prompt.title}</p>
          {canChangePicture && onChangePicture && (
            <button
              className="rounded-full border border-ink/30 bg-surface px-3 py-1 text-sm font-bold text-ink disabled:cursor-wait disabled:opacity-60"
              disabled={isChangeDisabled || isChangingPicture}
              onClick={onChangePicture}
              type="button"
            >
              {isChangingPicture ? "Changing…" : "Change picture"}
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Speak about the picture
        </h1>
        <p className="mt-1 text-base text-muted">{prompt.instruction}</p>
        {onDmWithPari && (
          <button
            className="mt-3 min-h-12 rounded-full border-2 border-ink bg-surface px-5 py-2 font-bold text-ink"
            onClick={onDmWithPari}
            type="button"
          >
            Can’t use the picture? DM with Pari
          </button>
        )}
      </header>
      <div className="p-3 sm:p-4">
        <Image
          alt={prompt.alt}
          className="aspect-[4/3] max-h-[430px] w-full rounded-xl border-2 border-ink object-cover sm:rounded-2xl"
          height={900}
          priority
          src={prompt.imageUrl}
          width={1200}
        />
      </div>
    </article>
  );
}
