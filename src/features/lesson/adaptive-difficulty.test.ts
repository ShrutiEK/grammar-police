import { describe, expect, it } from "vitest";

import {
  getNextDifficulty,
  getStartingDifficulty,
} from "./adaptive-difficulty";

describe("getNextDifficulty", () => {
  it("increases one level after a correct answer", () => {
    expect(getNextDifficulty(2, true)).toBe(3);
  });

  it("keeps the same level after an incorrect answer", () => {
    expect(getNextDifficulty(2, false)).toBe(2);
  });

  it("does not increase past the maximum level", () => {
    expect(getNextDifficulty(5, true)).toBe(5);
  });

  it.each([
    ["emerging", 1],
    ["developing", 2],
    ["secure", 3],
    ["strong", 4],
  ] as const)("starts the %s band at difficulty %s", (band, difficulty) => {
    expect(getStartingDifficulty(band)).toBe(difficulty);
  });
});
