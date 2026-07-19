import { describe, expect, it } from "vitest";

import type { PictureConversationAssessmentInput } from "@/features/assessment/picture-conversation.schema";

import { createPictureConversationPrompt } from "./create-picture-conversation-prompt";

const spokenInput: PictureConversationAssessmentInput = {
  pictureDescription: "A girl is playing football.",
  turns: [
    {
      answerMode: "spoken",
      audioDurationInSeconds: 4,
      isGrounded: true,
      isRelevantToFocus: true,
      kind: "scene_description",
      languageWarning: false,
      prompt: "What is the girl doing?",
      responseText: "Shes playing football.",
    },
  ],
};

describe("picture conversation assessment prompt", () => {
  it("separates spoken contractions and auxiliary verbs from articles", () => {
    const prompt = createPictureConversationPrompt("grammar", spokenInput);

    expect(prompt).toContain(`"responseText":"Shes playing football."`);
    expect(prompt).toContain(
      `"Shes playing" in a spoken transcript is probable "She's playing"`,
    );
    expect(prompt).toContain('"Is" is a verb, never an article.');
    expect(prompt).toContain(
      "Recommend articles only when the evidence identifies a decision involving a, an, the, or zero article",
    );
  });

  it("allows a typed unmapped finding without routing an unrelated skill", () => {
    const prompt = createPictureConversationPrompt("grammar", spokenInput);

    expect(prompt).toContain("Use findingStatus unmapped");
    expect(prompt).toContain(
      "Set nextSkill to none and name the concept briefly in unmappedSkill",
    );
  });
});
