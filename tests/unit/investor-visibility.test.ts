import { describe, expect, it } from "vitest";
import {
  canReadInvestorRecord,
  canUseVisibilityWithinAccount,
} from "../../lib/investor-relations/visibility";

describe("investor visibility", () => {
  it("keeps private records visible only to their owner", () => {
    expect(
      canReadInvestorRecord({
        role: "ANALYST",
        userId: "owner",
        ownerUserId: "owner",
        visibility: "PRIVATE",
      }),
    ).toBe(true);
    expect(
      canReadInvestorRecord({
        role: "ADMINISTRATOR",
        userId: "admin",
        ownerUserId: "owner",
        visibility: "PRIVATE",
      }),
    ).toBe(false);
  });

  it("allows management records for the owner and management roles", () => {
    expect(
      canReadInvestorRecord({
        role: "ANALYST",
        userId: "owner",
        ownerUserId: "owner",
        visibility: "MANAGEMENT",
      }),
    ).toBe(true);
    expect(
      canReadInvestorRecord({
        role: "DIRECTOR",
        userId: "director",
        ownerUserId: "owner",
        visibility: "MANAGEMENT",
      }),
    ).toBe(true);
    expect(
      canReadInvestorRecord({
        role: "ANALYST",
        userId: "peer",
        ownerUserId: "owner",
        visibility: "MANAGEMENT",
      }),
    ).toBe(false);
  });

  it("does not let a roadshow widen the visibility of its investor account", () => {
    expect(canUseVisibilityWithinAccount("PRIVATE", "TEAM")).toBe(true);
    expect(canUseVisibilityWithinAccount("MANAGEMENT", "TEAM")).toBe(true);
    expect(canUseVisibilityWithinAccount("TEAM", "MANAGEMENT")).toBe(false);
    expect(canUseVisibilityWithinAccount("MANAGEMENT", "PRIVATE")).toBe(false);
  });
});
