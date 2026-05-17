/**
 * Re-runs extraction on rows that failed with PARSE_ERROR.
 * Use after fixing extraction logic to avoid re-scraping.
 */
import * as dotenv from "dotenv"
dotenv.config()

async function main() {
  const { db }  = await import("@/lib/db")
  const { processPendingAnnouncements } = await import("./extract/extract-announcement")

  // Reset PARSE_ERROR rows so processPendingAnnouncements picks them up again
  const reset = await db.rawAnnouncement.updateMany({
    where: { extractedData: { path: ["type"], equals: "PARSE_ERROR" } },
    data:  { processedAt: null, extractedData: undefined },
  })
  console.log(`Reset ${reset.count} PARSE_ERROR rows`)

  // Also drain any genuinely unprocessed rows
  const n = await processPendingAnnouncements(500)
  console.log(`Processed ${n} announcements`)
}

main().catch(console.error)
