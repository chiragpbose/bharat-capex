import { z } from "zod"

export const TenderStatusSchema = z.enum([
  "AWARDED",
  "UNDER_EVALUATION",
  "CANCELLED",
  "COMPLETED",
])

export const CreateTenderSchema = z.object({
  title: z.string().min(5).max(300),
  slug: z
    .string()
    .min(3)
    .max(150)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  status: TenderStatusSchema.default("AWARDED"),
  valueCrore: z.number().positive().optional(),
  awardedAt: z.coerce.date().optional(),
  completionDate: z.coerce.date().optional(),
  awardingBody: z.string().min(2).max(100),
  sourceUrl: z.string().url().optional(),
  companyId: z.string().cuid(),
  sectorId: z.string().cuid(),
  schemeIds: z.array(z.string().cuid()).default([]),
})

export const UpdateTenderSchema = CreateTenderSchema.partial().extend({
  id: z.string().cuid(),
})

export const TenderQuerySchema = z.object({
  status: TenderStatusSchema.optional(),
  companyId: z.string().cuid().optional(),
  sectorId: z.string().cuid().optional(),
  awardingBody: z.string().optional(),
  minValue: z.coerce.number().positive().optional(),
  maxValue: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateTender = z.infer<typeof CreateTenderSchema>
export type UpdateTender = z.infer<typeof UpdateTenderSchema>
export type TenderQuery = z.infer<typeof TenderQuerySchema>
