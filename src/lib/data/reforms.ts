import "server-only"
import { db } from "@/lib/db"

export async function getReforms(status?: string, sectorName?: string) {
  return db.reform.findMany({
    where: {
      ...(status     ? { status:          status     as never } : {}),
      ...(sectorName ? { sector: { name: sectorName }         } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      sector: { select: { id: true, name: true, slug: true, color: true } },
      scheme: { select: { id: true, name: true, slug: true } },
    },
  })
}

export async function getReformBySlug(slug: string) {
  return db.reform.findUnique({
    where: { slug },
    include: {
      sector: true,
      scheme: true,
    },
  })
}

export async function getCompaniesBySectorId(sectorId: string) {
  return db.company.findMany({
    where: { sectors: { some: { sectorId } } },
    include: { sectors: { include: { sector: true } } },
    orderBy: { orderBookCrore: "desc" },
  })
}

export async function getRelatedReforms(sectorId: string, excludeSlug: string) {
  return db.reform.findMany({
    where: { sectorId, slug: { not: excludeSlug } },
    include: {
      sector: { select: { name: true, color: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
}
