import { describe, expect, it } from "vitest";

import {
  getDifficultyGuidance,
  getExerciseBlueprint,
} from "./exercise-blueprint";
import { learningSkillSchema } from "./learning-assessment.schema";
import { isLessonSkillSupported } from "./skill-blueprint-seeds";

describe("exercise blueprints", () => {
  it("provides five distinct article difficulty stages", () => {
    const blueprint = getExerciseBlueprint("articles");
    const stages = [1, 2, 3, 4, 5].map((difficulty) =>
      getDifficultyGuidance(blueprint, difficulty as 1 | 2 | 3 | 4 | 5),
    );

    expect(new Set(stages).size).toBe(5);
    expect(blueprint.allowedExerciseTypes).toContain("fill_blank");
  });

  it("selects adjective examples without unrelated article examples", () => {
    const examples = getExerciseBlueprint("descriptive_adjectives")
      .fewShots.map((example) => example.content)
      .join(" ");

    expect(examples).toContain("striped");
    expect(examples).not.toContain("elephant");
  });

  it("returns a skill-specific blueprint for a remaining catalog skill", () => {
    const blueprint = getExerciseBlueprint("past_tense");

    expect(blueprint.skill).toBe("past_tense");
    expect(blueprint.goal).toContain("past-tense");
    expect(blueprint.allowedExerciseTypes.length).toBeGreaterThan(0);
  });

  it("accounts for every learning skill and blocks pronunciation-only skills", () => {
    const unsupportedSkills = learningSkillSchema.options.filter(
      (skill) => !isLessonSkillSupported(skill),
    );

    expect(unsupportedSkills).toEqual([
      "sound_articulation",
      "word_stress",
      "sentence_stress_and_intonation",
    ]);

    for (const skill of learningSkillSchema.options) {
      if (unsupportedSkills.includes(skill)) {
        expect(() => getExerciseBlueprint(skill)).toThrow("audio-aware");
      } else {
        expect(getExerciseBlueprint(skill).skill).toBe(skill);
      }
    }
  });
});
