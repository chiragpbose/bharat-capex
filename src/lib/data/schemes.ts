import "server-only"
import { db } from "@/lib/db"

export async function getSchemes(sectorName?: string) {
  return db.scheme.findMany({
    where: sectorName
      ? { sectors: { some: { sector: { name: sectorName } } } }
      : undefined,
    orderBy: { budgetOutlayCrore: "desc" },
    include: {
      sectors: { include: { sector: true } },
    },
  })
}

export async function getSchemeBySlug(slug: string) {
  return db.scheme.findUnique({
    where: { slug },
    include: {
      sectors: { include: { sector: true } },
      companies: {
        include: {
          company: {
            include: { sectors: { include: { sector: true } } },
          },
        },
      },
      reforms: {
        include: { sector: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  })
}
