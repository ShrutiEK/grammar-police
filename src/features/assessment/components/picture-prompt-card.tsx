import Image from "next/image";

import type { PicturePrompt } from "@/features/picture-prompt/picture-prompt.data";

type PicturePromptCardProperties = Readonly<{
  prompt: PicturePrompt;
}>;

export function PicturePromptCard({ prompt }: PicturePromptCardProperties) {
  return (
    <article className="overflow-hidden rounded-[2rem] border-[3px] border-ink bg-white shadow-card">
      <header className="border-b-2 border-ink bg-accent-soft px-6 py-5 sm:px-8">
        <p className="section-eyebrow mb-2">{prompt.title}</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Speak about the picture
        </h1>
        <p className="mt-2 text-muted">{prompt.instruction}</p>
      </header>
      <div className="p-5 sm:p-8">
        <Image
          alt={prompt.alt}
          className="aspect-[4/3] w-full rounded-2xl border-2 border-ink object-cover"
          height={900}
          priority
          src={prompt.imageUrl}
          width={1200}
        />
      </div>
    </article>
  );
}
