import { z } from "zod";
import { investorVisibilityValues } from "./visibility";

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .transform((value) => value || undefined);

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "日期格式不正确。");

const optionalInteger = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().int().min(0).max(max).optional(),
  );

export const investorAccountSchema = z.object({
  name: z.string().trim().min(1).max(160),
  investorType: z.enum([
    "INSTITUTION",
    "FUND",
    "STRATEGIC",
    "FAMILY_OFFICE",
    "INDIVIDUAL",
    "OTHER",
  ]).default("INSTITUTION"),
  relationshipStage: z.enum([
    "TARGET",
    "ENGAGED",
    "DILIGENCE",
    "ACTIVE",
    "PAUSED",
    "DECLINED",
  ]).default("TARGET"),
  focus: optionalText(500),
  geography: optionalText(120),
  website: z
    .string()
    .trim()
    .url("网站地址格式不正确。")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  notes: optionalText(4_000),
  visibility: z.enum(investorVisibilityValues).default("TEAM"),
  nextAction: optionalText(1_000),
  nextActionAt: optionalDate,
  primaryContact: z
    .object({
      name: z.string().trim().min(1).max(120),
      title: optionalText(160),
      email: z.string().trim().email("邮箱格式不正确。").optional().or(z.literal(""))
        .transform((value) => value || undefined),
      phone: optionalText(80),
      wechat: optionalText(120),
    })
    .optional(),
});

export const investorContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: optionalText(160),
  email: z.string().trim().email("邮箱格式不正确。").optional().or(z.literal(""))
    .transform((value) => value || undefined),
  phone: optionalText(80),
  wechat: optionalText(120),
  notes: optionalText(2_000),
  isPrimary: z.boolean().optional().default(false),
});

export const roadshowRecordSchema = z.object({
  investorAccountId: z.string().uuid(),
  investorContactId: z.string().uuid().optional().or(z.literal(""))
    .transform((value) => value || undefined),
  title: z.string().trim().min(1).max(240),
  format: z.enum(["ONLINE", "IN_PERSON", "PHONE", "CONFERENCE", "OTHER"]).default("ONLINE"),
  occurredAt: z.coerce.date(),
  durationSeconds: optionalInteger(86_400),
  audioUrl: z.string().trim().url("音频链接格式不正确。").optional().or(z.literal(""))
    .transform((value) => value || undefined),
  transcript: optionalText(20_000),
  keyTakeaways: optionalText(6_000),
  nextAction: optionalText(1_000),
  followUpDueAt: optionalDate,
  visibility: z.enum(investorVisibilityValues).default("TEAM"),
  segments: z
    .array(
      z.object({
        startSeconds: z.number().int().min(0),
        endSeconds: z.number().int().min(0),
        speaker: optionalText(120),
        content: z.string().trim().min(1).max(4_000),
      }).refine((segment) => segment.endSeconds >= segment.startSeconds, {
        message: "结束时间不能早于开始时间。",
      }),
    )
    .max(100)
    .default([]),
});
