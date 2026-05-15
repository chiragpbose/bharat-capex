import * as dotenv from "dotenv"
dotenv.config()

async function main() {
  const { db } = await import("@/lib/db")

  const rows = await db.rawAnnouncement.findMany({
    orderBy: { publishedAt: "desc" },
    take: 60,
    select: { source: true, title: true, publishedAt: true, processedAt: true },
  })

  const bySource: Record<string, typeof rows> = {}
  for (const r of rows) {
    bySource[r.source] = bySource[r.source] ?? []
    bySource[r.source].push(r)
  }

  for (const [source, items] of Object.entries(bySource)) {
    console.log(`\n═══ ${source} (${items.length} shown) ═══`)
    items.slice(0, 15).forEach(r => console.log("  •", r.title.slice(0, 110)))
  }

  const total = await db.rawAnnouncement.count()
  console.log(`\nTotal rows in DB: ${total}`)
}

main().catch(console.error)
