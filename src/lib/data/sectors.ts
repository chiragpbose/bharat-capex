import "server-only"
import { db } from "@/lib/db"

export async function getAllSectors() {
  return db.sector.findMany({
    orderBy: { govtOutlayCrore: "desc" },
  })
}

export async function getSectorBySlug(slug: string) {
  return db.sector.findUnique({ where: { slug } })
}
