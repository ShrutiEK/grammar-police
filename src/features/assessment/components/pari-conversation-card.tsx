import Image from "next/image";

import {
  pariConversationTopics,
  pariIllustrationAsset,
  type PariConversationTopicId,
} from "../pari-conversation.data";

type PariConversationCardProperties = Readonly<{
  activeTopicId: PariConversationTopicId | null;
  isDisabled: boolean;
  onChooseTopic: (topicId: PariConversationTopicId) => void;
  onReturnToPicture: () => void;
}>;

export function PariConversationCard({
  activeTopicId,
  isDisabled,
  onChooseTopic,
  onReturnToPicture,
}: PariConversationCardProperties) {
  return (
    <article
      aria-labelledby="pari-card-title"
      className="overflow-hidden rounded-2xl border-2 border-ink bg-surface shadow-[5px_5px_0_#17213d] sm:rounded-3xl"
    >
      <div className="relative border-b-2 border-ink bg-accent-soft">
        <Image
          alt=""
          className="aspect-[16/8] w-full object-cover object-center"
          priority
          src={pariIllustrationAsset}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff9ed]/95 via-[#fff9ed]/75 to-transparent p-4 sm:p-5">
          <p className="section-eyebrow mb-1">
            A conversation without an image
          </p>
          <h1
            className="max-w-[12ch] text-3xl font-bold tracking-tight text-[#17213d]"
            id="pari-card-title"
          >
            DM with Pari
          </h1>
          <p className="mt-2 max-w-[28ch] text-base font-semibold text-[#343c52]">
            Choose something familiar. Pari will listen and keep the
            conversation going.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {!activeTopicId ? (
          <fieldset disabled={isDisabled}>
            <legend className="text-lg font-bold text-ink">
              What would you like to talk about?
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {pariConversationTopics.map((topic) => (
                <button
                  className="min-h-24 rounded-xl border-2 border-ink bg-canvas p-3 text-left text-ink"
                  key={topic.id}
                  onClick={() => onChooseTopic(topic.id)}
                  type="button"
                >
                  <span className="block text-lg font-bold">{topic.label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {topic.description}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-xl border-2 border-support bg-canvas p-4 text-base text-ink">
            <span className="font-bold">You’re chatting about: </span>
            {
              pariConversationTopics.find((topic) => topic.id === activeTopicId)
                ?.label
            }
          </p>
        )}

        <button
          className="mt-4 min-h-12 rounded-full border-2 border-ink bg-surface px-5 py-2 font-bold text-ink"
          disabled={isDisabled}
          onClick={onReturnToPicture}
          type="button"
        >
          Use a picture instead
        </button>
      </div>
    </article>
  );
}
