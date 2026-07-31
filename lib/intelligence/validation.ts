import { z } from "zod";

export const intelligenceQuerySchema = z.object({
  category: z.string().trim().max(80).optional(),
  company: z.uuid().optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});
