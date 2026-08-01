import { z } from "zod";
import { researchDimensions, subtypeMeta } from "./types";

const nullableText = z.string().trim().max(2_000).nullable().optional();

export const researchItemInputSchema = z
  .object({
    dimension: z.enum(researchDimensions),
    subtype: z.string().trim().min(2).max(80),
    title: z.string().trim().min(3).max(240),
    summary: z.string().trim().min(10).max(2_000),
    whatHappened: z.string().trim().min(10).max(12_000),
    whyItMatters: z.string().trim().min(10).max(12_000),
    cloudskyImplication: z.string().trim().min(10).max(12_000),
    recommendedAction: z.string().trim().min(3).max(4_000),
    eventDate: z.iso.date(),
    importance: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
    status: z.enum([
      "INBOX",
      "REVIEWED",
      "TRACKING",
      "ACTION_REQUIRED",
      "ARCHIVED",
    ]),
    ownerUserId: z.string().uuid().nullable().optional(),
    nextAction: z.string().trim().min(3).max(2_000),
    nextFollowUpDate: z.iso.date(),
    details: z.record(z.string(), z.unknown()).optional(),
    organizations: z
      .array(
        z.object({
          name: z.string().trim().min(2).max(200),
          organizationType: z.string().trim().max(40).optional(),
          country: z.string().trim().max(100).nullable().optional(),
          website: z.url().max(500).nullable().optional(),
          description: nullableText,
          relationship: z.string().trim().max(120).nullable().optional(),
        }),
      )
      .max(30),
    sources: z
      .array(
        z.object({
          sourceType: z.string().trim().min(2).max(80),
          title: z.string().trim().min(3).max(300),
          url: z.url().max(1_000).nullable().optional(),
          filePath: z.string().trim().max(1_000).nullable().optional(),
          publisher: z.string().trim().max(200).nullable().optional(),
          publishedAt: z.iso.datetime().nullable().optional(),
          pageNumber: z.number().int().positive().nullable().optional(),
          quotedText: z.string().trim().max(6_000).nullable().optional(),
        }),
      )
      .min(1)
      .max(30),
    changeSummary: z.string().trim().max(1_000).optional(),
  })
  .superRefine((value, ctx) => {
    if (!subtypeMeta[value.dimension][value.subtype]) {
      ctx.addIssue({
        code: "custom",
        path: ["subtype"],
        message: "该研究类型不属于当前模块。",
      });
    }
  });
