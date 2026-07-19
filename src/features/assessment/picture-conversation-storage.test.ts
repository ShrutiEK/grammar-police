import { afterEach, describe, expect, it, vi } from "vitest";

import {
  METRIC_IDS,
  type PictureConversationFeedback,
  type PictureConversationTurn,
} from "./picture-conversation.schema";
import { samplePictureConversation } from "./sample-picture-conversation.data";
import {
  pictureConversationFeedbackStorageKey,
  loadPictureConversationFeedbackForInput,
  savePictureConversationFeedback,
} from "./picture-conversation-storage";

function createStorage() {
  const values = new Map<string, string>();

  return {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: () => null,
    get length() {
      return values.size;
    },
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  } as Storage;
}

const feedback: PictureConversationFeedback = {
  assessment: {
    learnerSummary: "You shared clear ideas about the picture.",
    metrics: METRIC_IDS.map((id) => ({
      confidence: "low",
      evidence: [],
      id,
      status: "not_assessed",
      unavailableReason: "We need another example to understand this.",
    })),
    primaryRecommendation: {
      reason: "Practise adding one more detail to each answer.",
      skill: "detail_expansion",
      track: "expression",
    },
  },
  status: "assessed",
};

const addedTurn: PictureConversationTurn = {
  answerMode: "written",
  isGrounded: true,
  isRelevantToFocus: true,
  kind: "picture_follow_up",
  languageWarning: false,
  prompt: "What else can you see?",
  responseText: "I can see a pond.",
};

describe("picture conversation feedback storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reuses feedback only when the complete conversation is unchanged", () => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());

    savePictureConversationFeedback(samplePictureConversation, feedback);

    expect(
      loadPictureConversationFeedbackForInput(samplePictureConversation),
    ).toEqual(feedback);
    expect(
      loadPictureConversationFeedbackForInput({
        ...samplePictureConversation,
        turns: [...samplePictureConversation.turns, addedTurn],
      }),
    ).toBeNull();
  });

  it("binds one legacy feedback result when the learner asks for it", () => {
    const localStorage = createStorage();
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("sessionStorage", createStorage());
    localStorage.setItem(
      pictureConversationFeedbackStorageKey,
      JSON.stringify(feedback),
    );

    expect(
      loadPictureConversationFeedbackForInput(samplePictureConversation),
    ).toEqual(feedback);
    expect(
      loadPictureConversationFeedbackForInput({
        ...samplePictureConversation,
        turns: [...samplePictureConversation.turns, addedTurn],
      }),
    ).toBeNull();
  });
});
