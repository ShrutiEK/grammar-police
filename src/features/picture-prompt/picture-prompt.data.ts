import type { StaticImageData } from "next/image";

import {
  pictureDescriptions,
  type PictureFilename,
} from "@/picture-descriptions/picture-descriptions.data";

export type PicturePrompt = Readonly<{
  filename: PictureFilename;
  imageUrl: StaticImageData;
  alt: string;
  title: string;
  instruction: string;
  description: string;
}>;

const picturePromptMetadata: Readonly<
  Record<PictureFilename, Pick<PicturePrompt, "alt" | "instruction" | "title">>
> = {
  "beach.png": {
    alt: "People taking part in a community clean-up on a busy beach",
    title: "The Beach Clean-up",
    instruction: "Describe what is happening in this beach scene.",
  },
  "classroom.png": {
    alt: "Children presenting experiments at a busy school science fair",
    title: "The Science Fair",
    instruction: "Describe what is happening at this science fair.",
  },
  "market.png": {
    alt: "Shoppers and vendors at a colourful open-air market",
    title: "The Community Market",
    instruction: "Describe what is happening in this market scene.",
  },
  "picnic.png": {
    alt: "Families and children enjoying different activities in a city park",
    title: "The Park Picnic",
    instruction: "Describe what is happening in this park scene.",
  },
  "railway.png": {
    alt: "A family reunion and travellers on a busy railway platform",
    title: "The Railway Platform",
    instruction: "Describe what is happening on this railway platform.",
  },
};

export const pictureFilenames = Object.keys(
  pictureDescriptions,
) as PictureFilename[];

export const picturePrompts = pictureFilenames.map((filename) => ({
  filename,
  imageUrl: pictureDescriptions[filename].image,
  description: pictureDescriptions[filename].description,
  ...picturePromptMetadata[filename],
}));

export const picturePromptsByFilename = Object.fromEntries(
  picturePrompts.map((prompt) => [prompt.filename, prompt]),
) as Readonly<Record<PictureFilename, PicturePrompt>>;

export const fallbackQuestionsByFilename: Readonly<
  Record<PictureFilename, string>
> = {
  "beach.png":
    "Look at the foreground. What is the girl with the litter picker doing?",
  "classroom.png":
    "Look at the centre of the picture. What is happening to the model volcano?",
  "market.png":
    "Look at the produce stall. What is the vendor doing with the tomatoes?",
  "picnic.png":
    "Look at the foreground. What are the two children doing with the red kite?",
  "railway.png":
    "Look at the centre of the platform. What are the boy and the older man about to do?",
};

export function selectRandomPictureFilename(
  excludedFilenames: ReadonlyArray<PictureFilename> = [],
) {
  const unseenFilenames = pictureFilenames.filter(
    (filename) => !excludedFilenames.includes(filename),
  );
  const availableFilenames =
    unseenFilenames.length > 0
      ? unseenFilenames
      : pictureFilenames.filter(
          (filename) => filename !== excludedFilenames.at(-1),
        );
  const randomIndex = Math.floor(Math.random() * availableFilenames.length);
  return availableFilenames[randomIndex]!;
}
