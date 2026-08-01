import { z } from "zod";
import {
  claimKindValues,
  researchConclusionValues,
  researchSectionDefinitions,
} from "./types";

const nullableShortText = z.string().trim().max(400).nullable().optional();
const nullableLongText = z.string().trim().max(12_000).nullable().optional();

export const createResearchReportSchema = z.object({
  companyId: z.string().uuid(),
  industryModuleId: z.string().uuid().nullable().optional(),
});

export const updateResearchReportSchema = z.object({
  conclusion: z.enum(researchConclusionValues).optional(),
  conclusionDate: z.iso.datetime().nullable().optional(),
  conclusionSummary: nullableLongText,
  coreTension: nullableLongText,
  confidence: z.number().int().min(0).max(100).nullable().optional(),
  competenceAssessment: nullableShortText,
  predictability3Year: z.number().int().min(0).max(100).nullable().optional(),
  predictability5Year: z.number().int().min(0).max(100).nullable().optional(),
  predictability10Year: z.number().int().min(0).max(100).nullable().optional(),
  valuationStatus: nullableShortText,
  industryModuleId: z.string().uuid().nullable().optional(),
  changeSummary: z.string().trim().min(2).max(500),
  sections: z
    .array(
      z.object({
        code: z.enum(researchSectionDefinitions.map((section) => section.code)),
        content: nullableLongText,
        claimKind: z.enum(claimKindValues),
      }),
    )
    .max(researchSectionDefinitions.length)
    .optional(),
  assumptions: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(4).max(600),
        status: z.string().trim().min(2).max(80),
        supportEvidence: nullableLongText,
        counterEvidence: nullableLongText,
        verificationMetric: nullableShortText,
        invalidationCondition: nullableLongText,
        nextReviewAt: z.iso.date().nullable().optional(),
        confidence: z.number().int().min(0).max(100).nullable().optional(),
        claimKind: z.enum(claimKindValues),
      }),
    )
    .max(7)
    .optional(),
});

export const researchTransitionSchema = z.object({
  action: z.enum(["SUBMIT", "APPROVE", "RETURN_TO_DRAFT"]),
  comment: z.string().trim().max(2_000).nullable().optional(),
});
