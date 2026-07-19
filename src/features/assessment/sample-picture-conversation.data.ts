import type { PictureConversationInput } from "./picture-conversation.schema";

export const samplePictureConversation: PictureConversationInput = {
  pictureFilename: "picnic.png",
  turns: [
    {
      answerMode: "written",
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "scene_description",
      languageWarning: false,
      prompt: "Describe what is happening in the picture.",
      responseText:
        "Two children are flying a red kite in the park while families are having a picnic nearby.",
    },
    {
      answerMode: "written",
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "personal_follow_up",
      languageWarning: false,
      prompt:
        "Have you flown a kite with someone before? What did you enjoy about it?",
      responseText:
        "I flew a kite with my sister at the beach because we liked running together in the wind.",
    },
  ],
};
