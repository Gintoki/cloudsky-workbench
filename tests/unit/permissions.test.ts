import { describe, expect, it } from "vitest";
import { hasPermission } from "../../lib/auth/permissions";
import type { AuthUser } from "../../lib/auth/types";

const user = (role: AuthUser["role"]) => ({ role });

describe("role permissions", () => {
  it("allows administrators to perform every modeled action", () => {
    expect(hasPermission(user("ADMINISTRATOR"), "settings.manage")).toBe(true);
    expect(hasPermission(user("ADMINISTRATOR"), "facts.approve")).toBe(true);
  });

  it("allows analysts to submit facts but not approve them", () => {
    expect(hasPermission(user("ANALYST"), "facts.submit")).toBe(true);
    expect(hasPermission(user("ANALYST"), "facts.approve")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(hasPermission(user("VIEWER"), "facts.read")).toBe(true);
    expect(hasPermission(user("VIEWER"), "intelligence.read")).toBe(true);
    expect(hasPermission(user("VIEWER"), "intelligence.update")).toBe(false);
    expect(hasPermission(user("VIEWER"), "facts.update")).toBe(false);
    expect(hasPermission(user("VIEWER"), "audit.read")).toBe(false);
  });
});
