import { describe, expect, it } from "vitest";
import { canTransitionFact } from "../../lib/facts/state-machine";

describe("fact state machine", () => {
  it("supports the review workflow", () => {
    expect(canTransitionFact("DRAFT", "PENDING_REVIEW")).toBe(true);
    expect(canTransitionFact("PENDING_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionFact("APPROVED", "SUPERSEDED")).toBe(true);
  });

  it("rejects bypassing review", () => {
    expect(canTransitionFact("DRAFT", "APPROVED")).toBe(false);
    expect(canTransitionFact("APPROVED", "DRAFT")).toBe(false);
    expect(canTransitionFact("ARCHIVED", "DRAFT")).toBe(false);
  });
});
