import { z } from "zod"

export const CreateCompanySchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  tickerNse: z.string().min(1).max(20).toUpperCase().optional(),
  tickerBse: z.string().min(1).max(20).toUpperCase().optional(),
  isin: z
    .string()
    .regex(/^INE[A-Z0-9]{9}$/, "ISIN must be in format INE + 9 alphanumeric chars")
    .optional(),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  sectorIds: z.array(z.string().cuid()).min(1, "At least one sector is required"),
})

export const UpdateCompanySchema = CreateCompanySchema.partial().extend({
  id: z.string().cuid(),
})

export const CompanyQuerySchema = z.object({
  sectorId: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateCompany = z.infer<typeof CreateCompanySchema>
export type UpdateCompany = z.infer<typeof UpdateCompanySchema>
export type CompanyQuery = z.infer<typeof CompanyQuerySchema>
