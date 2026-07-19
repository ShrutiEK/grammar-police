import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConversationTrail } from "./conversation-trail";

describe("ConversationTrail", () => {
  it("announces the current prompt and marks earlier prompts as complete", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationTrail, { currentQuestionNumber: 3 }),
    );

    expect(markup).toContain(
      'aria-label="Conversation progress: prompt 3 of 8"',
    );
    expect(markup.match(/conversation-trail-dot-complete/g)).toHaveLength(2);
    expect(markup.match(/conversation-trail-dot-current/g)).toHaveLength(1);
    expect(markup).toContain("Each answer opens a more personal question.");
  });

  it("shows final-prompt guidance at the end of the trail", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationTrail, { currentQuestionNumber: 8 }),
    );

    expect(markup).toContain(
      "One last answer, then your highlights are ready.",
    );
  });
});
