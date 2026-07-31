import type { ContentStatus } from "@/lib/domain/types";

const transitions: Record<ContentStatus, ReadonlySet<ContentStatus>> = {
  DRAFT: new Set(["PENDING_REVIEW", "ARCHIVED"]),
  PENDING_REVIEW: new Set(["APPROVED", "DRAFT", "ARCHIVED"]),
  APPROVED: new Set(["SUPERSEDED", "ARCHIVED"]),
  SUPERSEDED: new Set(["ARCHIVED"]),
  ARCHIVED: new Set(),
};

export function canTransitionFact(
  current: ContentStatus,
  next: ContentStatus,
): boolean {
  return transitions[current].has(next);
}
