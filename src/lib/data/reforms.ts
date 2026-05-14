import "server-only"
import { db } from "@/lib/db"
import type { ReformQuery } from "@/lib/validations/reform"

export async function getReforms(query: Partial<ReformQuery> = {}) {
  const { status, difficulty, sectorId, page = 1, pageSize = 20 } = query

  const where = {
    ...(status && { status }),
    ...(difficulty && { difficulty }),
    ...(sectorId && { sectorId }),
  }

  const skip = (page - 1) * pageSize

  const [reforms, total] = await Promise.all([
    db.reform.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        sector: { select: { id: true, name: true, slug: true, color: true } },
        scheme: { select: { id: true, name: true, slug: true } },
      },
    }),
    db.reform.count({ where }),
  ])

  return { reforms, total, page, pageSize }
}

export async function getReformBySlug(slug: string) {
  return db.reform.findUnique({
    where: { slug },
    include: {
      sector: true,
      scheme: true,
      news: {
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
    },
  })
}

export async function getSectors() {
  return db.sector.findMany({ orderBy: { name: "asc" } })
}
