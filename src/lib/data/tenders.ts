import "server-only"
import { db } from "@/lib/db"

export async function getTenders(sectorSlug?: string) {
  return db.tender.findMany({
    where: sectorSlug ? { sector: { slug: sectorSlug } } : undefined,
    orderBy: { awardedAt: "desc" },
    include: {
      company: { select: { name: true, slug: true, tickerNse: true } },
      sector:  { select: { name: true, color: true, slug: true } },
      schemes: { include: { scheme: { select: { name: true, slug: true } } } },
    },
  })
}
