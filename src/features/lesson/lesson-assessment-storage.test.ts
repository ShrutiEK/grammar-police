import { describe, expect, it } from "vitest";

import { demoLessonAssessment } from "./demo-assessment";
import {
  lessonAssessmentStorageKey,
  loadLessonAssessment,
  saveLessonAssessment,
} from "./lesson-assessment-storage";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("lesson assessment handoff", () => {
  it("validates, stores, and restores a complete metrics assessment", () => {
    const storage = createMemoryStorage();

    saveLessonAssessment(demoLessonAssessment, storage);

    expect(loadLessonAssessment(storage)).toEqual(demoLessonAssessment);
  });

  it("accepts evidence from a picture follow-up turn", () => {
    const storage = createMemoryStorage();
    const assessment = {
      ...demoLessonAssessment,
      metrics: [
        {
          ...demoLessonAssessment.metrics[0],
          evidence: [
            {
              learnerText: "The kite is above the trees.",
              observation: "The learner used one clear spatial detail.",
              turn: "picture_follow_up",
            },
          ],
        },
      ],
    };

    saveLessonAssessment(assessment, storage);

    expect(loadLessonAssessment(storage)?.metrics[0]?.evidence[0]?.turn).toBe(
      "picture_follow_up",
    );
  });

  it("removes invalid stored handoffs instead of using them", () => {
    const storage = createMemoryStorage();
    storage.setItem(lessonAssessmentStorageKey, JSON.stringify({ bad: true }));

    expect(() => loadLessonAssessment(storage)).toThrow("invalid");
    expect(storage.getItem(lessonAssessmentStorageKey)).toBeNull();
  });
});
