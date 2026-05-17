import * as dotenv from "dotenv"
dotenv.config()

async function main() {
  const { db } = await import("@/lib/db")

  // ── Extraction summary ──────────────────────────────────────────
  const processed = await db.rawAnnouncement.findMany({
    where:   { processedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select:  { source: true, title: true, extractedData: true, publishedAt: true },
  })

  const relevant   = processed.filter(r => (r.extractedData as any)?.isRelevant === true)
  const irrelevant = processed.filter(r => (r.extractedData as any)?.isRelevant === false)
  const errors     = processed.filter(r => !(r.extractedData as any)?.isRelevant === undefined)

  console.log(`\n═══ EXTRACTION SUMMARY ═══`)
  console.log(`  Processed : ${processed.length}`)
  console.log(`  Relevant  : ${relevant.length}`)
  console.log(`  Filtered  : ${irrelevant.length}`)

  // ── Relevant signals ────────────────────────────────────────────
  if (relevant.length > 0) {
    console.log(`\n═══ RELEVANT SIGNALS (${relevant.length}) ═══`)
    for (const r of relevant) {
      const d = r.extractedData as any
      const value = d?.valueCrore ? `  ₹${d.valueCrore}cr` : ""
      const type  = d?.type       ? `  [${d.type}]`        : ""
      console.log(`\n  [${r.source}]${type}${value}`)
      console.log(`  ${r.title.slice(0, 100)}`)
      if (d?.summary) console.log(`  → ${d.summary.slice(0, 160)}`)
      if (d?.awardingBody) console.log(`  → Awarding body: ${d.awardingBody}`)
    }
  }

  // ── Unprocessed ─────────────────────────────────────────────────
  const unprocessed = await db.rawAnnouncement.count({ where: { processedAt: null } })
  console.log(`\n═══ QUEUE ═══`)
  console.log(`  Unprocessed: ${unprocessed} announcements waiting for extraction`)

  // ── Source breakdown ────────────────────────────────────────────
  const all = await db.rawAnnouncement.groupBy({
    by: ["source"],
    _count: { id: true },
  })
  console.log(`\n═══ ROWS BY SOURCE ═══`)
  for (const s of all.sort((a,b) => b._count.id - a._count.id)) {
    console.log(`  ${s.source.padEnd(16)} ${s._count.id}`)
  }

  const total = await db.rawAnnouncement.count()
  console.log(`\n  Total: ${total}`)

  // ── PIB quality check ───────────────────────────────────────────
  const pibSample = await db.rawAnnouncement.findMany({
    where:  { source: "PIB" },
    take:   3,
    select: { title: true, body: true },
  })
  console.log(`\n═══ PIB BODY CHECK (3 samples) ═══`)
  for (const p of pibSample) {
    const isEnglish = p.body && !/[ऀ-ॿ]/.test(p.body.slice(0, 100))
    console.log(`  title: ${p.title.slice(0, 80)}`)
    console.log(`  body:  ${p.body ? (isEnglish ? "✅ English" : "⚠ Hindi/empty") + " — " + p.body.slice(0, 100) : "❌ null"}`)
    console.log()
  }
}

main().catch(console.error)
