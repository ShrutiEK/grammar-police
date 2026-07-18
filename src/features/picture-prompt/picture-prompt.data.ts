export type PicturePrompt = Readonly<{
  imageUrl: string;
  alt: string;
  title: string;
  instruction: string;
  description: string;
}>;

export const picturePrompts: PicturePrompt[] = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85",
    alt: "Friends watching a sunset",
    title: "Picture Mission 1: The Sunset and Friendship",
    instruction: "Describe what is happening in this soccer match.",
    description: "Children playing football/soccer together on a grassy field.",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=1200&q=85",
    alt: "A student walking through the library",
    title: "Picture Mission 2: The library",
    instruction: "Describe your last visit to a library",
    description:
      "Students studying and reading books together in a classroom or library.",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=85",
    alt: "Children drawing and painting on a large table",
    title: "Picture Mission 3: Art Class",
    instruction: "Describe the children making art.",
    description:
      "Children drawing, painting, and crafting together at a table in an art room.",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=1200&q=85",
    alt: "A family having a picnic in a sunny park under a tree",
    title: "Picture Mission 4: The Family Picnic",
    instruction: "Describe what this family is doing in the park.",
    description:
      "A happy family having a picnic together on a grassy lawn in a sunny park under a tree.",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=85",
    alt: "Children celebrating at a colorful birthday party",
    title: "Picture Mission 5: The Birthday Party",
    instruction: "Describe the birthday party scene.",
    description:
      "Children celebrating, wearing party hats, and playing with balloons at a colorful birthday party.",
  },
];
