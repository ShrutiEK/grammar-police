import { describe, expect, it, vi } from "vitest";

import { retryInvalidExercise } from "./retry-invalid-exercise";

const validExercise = {
  exerciseType: "choose_precise_word",
  prompt: "Choose the adjective.",
  choices: ["bright", "quickly", "runs"],
  correctChoice: 0,
  hint: "Find the describing word.",
  successMessage: "Correct!",
  explanation: "Bright describes a noun.",
};

describe("retryInvalidExercise", () => {
  it("retries malformed candidates and returns the first valid exercise", async () => {
    const generateCandidate = vi
      .fn<(attempt: number, validationFeedback?: string) => Promise<unknown>>()
      .mockResolvedValueOnce({
        ...validExercise,
        choices: ["same", "same", "other"],
      })
      .mockResolvedValueOnce(validExercise);

    await expect(retryInvalidExercise(generateCandidate)).resolves.toEqual(
      validExercise,
    );
    expect(generateCandidate).toHaveBeenCalledTimes(2);
    expect(generateCandidate.mock.calls[1]?.[1]).toContain(
      "Exercise choices must be unique",
    );
  });

  it("stops after three invalid candidates", async () => {
    const generateCandidate = vi.fn(async () => ({ invalid: true }));

    await expect(retryInvalidExercise(generateCandidate)).rejects.toThrow(
      "after retrying",
    );
    expect(generateCandidate).toHaveBeenCalledTimes(3);
  });

  it("does not retry provider transport failures", async () => {
    const generateCandidate = vi.fn(async () => {
      throw new Error("Network unavailable");
    });

    await expect(retryInvalidExercise(generateCandidate)).rejects.toThrow(
      "Network unavailable",
    );
    expect(generateCandidate).toHaveBeenCalledTimes(1);
  });
});
