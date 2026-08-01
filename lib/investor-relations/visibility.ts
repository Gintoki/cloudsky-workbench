import type { RoleCode } from "@/lib/auth/types";

export const investorVisibilityValues = ["PRIVATE", "TEAM", "MANAGEMENT"] as const;

export type InvestorVisibility = (typeof investorVisibilityValues)[number];

export const investorVisibilityLabels: Record<InvestorVisibility, string> = {
  PRIVATE: "仅本人",
  TEAM: "团队可见",
  MANAGEMENT: "管理层可见",
};

const visibilityRank: Record<InvestorVisibility, number> = {
  PRIVATE: 0,
  MANAGEMENT: 1,
  TEAM: 2,
};

export function isInvestorManagementRole(role: RoleCode) {
  return role === "ADMINISTRATOR" || role === "DIRECTOR";
}

export function canReadInvestorRecord({
  role,
  userId,
  ownerUserId,
  visibility,
}: {
  role: RoleCode;
  userId: string;
  ownerUserId: string | null;
  visibility: InvestorVisibility;
}) {
  if (visibility === "TEAM") return true;
  if (ownerUserId === userId) return true;
  return visibility === "MANAGEMENT" && isInvestorManagementRole(role);
}

export function canUseVisibilityWithinAccount(
  recordVisibility: InvestorVisibility,
  accountVisibility: InvestorVisibility,
) {
  return visibilityRank[recordVisibility] <= visibilityRank[accountVisibility];
}
