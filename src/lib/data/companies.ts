import "server-only"
import { db } from "@/lib/db"

export async function getCompanies(sectorSlug?: string) {
  return db.company.findMany({
    where: sectorSlug
      ? { sectors: { some: { sector: { slug: sectorSlug } } } }
      : undefined,
    orderBy: { orderBookCrore: "desc" },
    include: {
      sectors: { include: { sector: true } },
    },
  })
}

export async function getCompanyBySlug(slug: string) {
  return db.company.findUnique({
    where: { slug },
    include: {
      sectors: { include: { sector: true } },
      tenders: {
        orderBy: { awardedAt: "desc" },
        include: {
          sector:  { select: { name: true, color: true, slug: true } },
          schemes: { include: { scheme: { select: { name: true, slug: true } } } },
        },
      },
    },
  })
}
