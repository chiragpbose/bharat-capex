import { z } from "zod"

export const ReformStatusSchema = z.enum([
  "PROPOSED",
  "NOTIFIED",
  "IMPLEMENTED",
  "STALLED",
  "REVERSED",
])

export const ReformDifficultySchema = z.enum(["LOW", "MEDIUM", "HIGH"])

export const CreateReformSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  summary: z.string().min(20).max(500),
  body: z.string().optional(),
  status: ReformStatusSchema.default("PROPOSED"),
  difficulty: ReformDifficultySchema.default("MEDIUM"),
  sectorId: z.string().cuid(),
  schemeId: z.string().cuid().optional(),
  notifiedAt: z.coerce.date().optional(),
  sourceUrl: z.string().url().optional(),
})

export const UpdateReformSchema = CreateReformSchema.partial().extend({
  id: z.string().cuid(),
})

export const ReformQuerySchema = z.object({
  status: ReformStatusSchema.optional(),
  difficulty: ReformDifficultySchema.optional(),
  sectorId: z.string().cuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateReform = z.infer<typeof CreateReformSchema>
export type UpdateReform = z.infer<typeof UpdateReformSchema>
export type ReformQuery = z.infer<typeof ReformQuerySchema>
