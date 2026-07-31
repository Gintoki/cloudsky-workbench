import { z } from "zod";

export const factInputSchema = z.object({
  primaryCategory: z.string().trim().min(1).max(80),
  secondaryCategory: z.string().trim().max(80).nullable().optional(),
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(10).max(10_000),
  numericValue: z.string().trim().max(60).nullable().optional(),
  unit: z.string().trim().max(40).nullable().optional(),
  measurementBasis: z.string().trim().min(3).max(2_000),
  periodLabel: z.string().trim().max(80).nullable().optional(),
  sourceTitle: z.string().trim().min(3).max(240),
  sourceQuote: z.string().trim().max(2_000).nullable().optional(),
});

export const metricInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[A-Z0-9_]+$/),
    name: z.string().trim().min(2).max(120),
    periodLabel: z.string().trim().min(2).max(80),
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    value: z.number().finite(),
    unit: z.string().trim().min(1).max(40),
    valueType: z.enum(["ACTUAL", "BUDGET", "FORECAST"]),
    scenario: z.enum(["BEAR", "BASE", "BULL"]),
    frequency: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]),
    measurementBasis: z.string().trim().min(3).max(2_000),
    sourceTitle: z.string().trim().min(3).max(240),
  })
  .refine((value) => value.periodStart <= value.periodEnd, {
    path: ["periodEnd"],
    message: "结束日期不能早于开始日期。",
  });
