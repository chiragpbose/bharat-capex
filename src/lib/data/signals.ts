import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"

export type SignalType =
  | "ORDER_WIN"
  | "CAPEX_PLAN"
  | "CAPACITY_EXPANSION"
  | "MANAGEMENT_PROMISE"
  | "POLICY_UPDATE"
  | "OTHER"

export type Signal = {
  id:           string
  source:       string
  title:        string
  publishedAt:  Date
  attachmentUrl: string | null
  type:         SignalType
  valueCrore:   number | null
  awardingBody: string | null
  summary:      string
}

export async function getSignals(opts: {
  type?:   string
  source?: string
  limit?:  number
  offset?: number
}): Promise<Signal[]> {
  const { type, source, limit = 100, offset = 0 } = opts

  const conditions: Prisma.RawAnnouncementWhereInput[] = [
    { processedAt: { not: null } },
    { extractedData: { path: ["isRelevant"], equals: true } },
  ]
  if (source) conditions.push({ source })
  if (type)   conditions.push({ extractedData: { path: ["type"], equals: type } })

  const where: Prisma.RawAnnouncementWhereInput = { AND: conditions }

  const rows = await db.rawAnnouncement.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take:    limit,
    skip:    offset,
    select:  { id: true, source: true, title: true, publishedAt: true, attachmentUrl: true, extractedData: true },
  })

  return rows.map((r) => {
    const d = r.extractedData as Record<string, unknown>
    return {
      id:           r.id,
      source:       r.source,
      title:        r.title,
      publishedAt:  r.publishedAt,
      attachmentUrl: r.attachmentUrl,
      type:         (d.type        as SignalType) ?? "OTHER",
      valueCrore:   (d.valueCrore  as number | null) ?? null,
      awardingBody: (d.awardingBody as string | null) ?? null,
      summary:      (d.summary     as string) ?? "",
    }
  })
}

export async function getSignalStats(): Promise<{
  total:     number
  byType:    Record<string, number>
  bySource:  Record<string, number>
}> {
  const rows = await db.rawAnnouncement.findMany({
    where:  { processedAt: { not: null }, extractedData: { path: ["isRelevant"], equals: true } },
    select: { source: true, extractedData: true },
  })

  const byType:   Record<string, number> = {}
  const bySource: Record<string, number> = {}

  for (const r of rows) {
    const d    = r.extractedData as Record<string, unknown>
    const type = (d.type as string) ?? "OTHER"
    byType[type]       = (byType[type]       ?? 0) + 1
    bySource[r.source] = (bySource[r.source] ?? 0) + 1
  }

  return { total: rows.length, byType, bySource }
}
