import pariIllustration from "@/assets/pari-dm.png";

export const pariConversationTopics = [
  {
    id: "movies",
    label: "Movies and shows",
    description:
      "Share a favourite, a memorable character, or what you watched recently.",
    openingQuestion:
      "What is a movie or show you enjoyed, and what made it memorable for you?",
  },
  {
    id: "stories",
    label: "Stories and poems",
    description: "Talk about a story, poem, or line that stayed with you.",
    openingQuestion:
      "Is there a story or poem you remember well? Tell me what stayed with you.",
  },
  {
    id: "hobbies",
    label: "Hobbies",
    description: "Tell Pari what you enjoy doing and why it matters to you.",
    openingQuestion:
      "What do you enjoy doing in your free time, and how did you become interested in it?",
  },
  {
    id: "daily-life",
    label: "Daily life",
    description: "Chat about an ordinary moment, routine, or recent day.",
    openingQuestion:
      "What is one part of your day that you usually enjoy? Tell me what makes it special.",
  },
] as const;

export type PariConversationTopicId =
  (typeof pariConversationTopics)[number]["id"];

export const pariIllustrationAsset = pariIllustration;

export function getPariConversationTopic(topicId: PariConversationTopicId) {
  return pariConversationTopics.find((topic) => topic.id === topicId)!;
}
