import { z } from "zod"

export const ContributionEntityTypeSchema = z.enum([
  "REFORM",
  "SCHEME",
  "TENDER",
  "COMPANY",
  "MANAGEMENT_PROMISE",
  "NEWS_ITEM",
])

export const SubmitContributionSchema = z.object({
  entityType: ContributionEntityTypeSchema,
  entityId: z.string().cuid().optional(),
  content: z.record(z.string(), z.unknown()),
  sourceUrl: z.string().url("A valid source URL is required"),
  submittedBy: z.string().email().optional(),
  companyId: z.string().cuid().optional(),
})

export type SubmitContribution = z.infer<typeof SubmitContributionSchema>
