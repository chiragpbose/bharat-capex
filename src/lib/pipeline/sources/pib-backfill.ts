/**
 * PIB historical backfill using PRID neighborhood discovery.
 *
 * allRel.aspx requires JavaScript (VIEWSTATE locks out server-side POST).
 * Instead, we exploit PIB's IframePage behavior:
 *
 *   - Valid PRID:   IframePage contains the input PRID + its language siblings
 *   - Invalid PRID: IframePage returns a directory of ~10-20 nearby valid PRIDs
 *
 * Algorithm:
 *   1. Probe below the lowest known PRID with an invalid number
 *   2. Collect all valid PRIDs returned in the neighbourhood listing
 *   3. Step back to just below the minimum discovered PRID
 *   4. Repeat until we've covered the lookback window
 *   5. For each new Hindi PRID → fetch English sibling → fetch body → upsert
 *
 * ~30-50 probes cover 30 days instead of the 4800 needed by brute-force iteration.
 */

import { db } from "@/lib/db"
import { fetchEnglishPrid, fetchEnglishBody, batchedMap, ENG_BASE_URL } from "./pib-rss"

const IFRAME_BASE = "https://pib.gov.in/PressReleaseIframePage.aspx?PRID="
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BharatCapex/1.0)" }

async function fetchIframeHtml(prid: number): Promise<string> {
  const res  = await fetch(IFRAME_BASE + prid, { headers: HEADERS })
  return res.ok ? res.text() : ""
}

function parsePridsFromHtml(html: string): number[] {
  const found = [...html.matchAll(/PressReleasePage\.aspx\?PRID=(\d+)/gi)]
  return [...new Set(found.map(m => parseInt(m[1])))].sort((a, b) => a - b)
}

export async function backfillPib(
  lookbackDays = 30,
): Promise<{ fetched: number; saved: number }> {
  // ── Step 1: find lowest Hindi PRID already in DB ──────────────────────────
  const lowestRow = await db.rawAnnouncement.findFirst({
    where:   { source: "PIB", externalId: { startsWith: "hindi-" } },
    orderBy: { externalId: "asc" },
    select:  { externalId: true },
  })
  const lowestKnownPrid = lowestRow
    ? parseInt(lowestRow.externalId.replace("hindi-", ""))
    : 0

  if (!lowestKnownPrid) {
    console.log("  No existing PIB rows — run the main pipeline first to seed the range.")
    return { fetched: 0, saved: 0 }
  }

  // Estimate the floor: ~16 PIB releases/day, avg gap ~10 PRID numbers
  const PRID_FLOOR = lowestKnownPrid - lookbackDays * 16 * 12  // generous 12× gap
  console.log(`  Scanning PRIDs ${PRID_FLOOR} → ${lowestKnownPrid - 1} (${lowestKnownPrid - PRID_FLOOR} range)`)

  // ── Step 2: neighbourhood discovery ──────────────────────────────────────
  const collectedHindiPrids = new Set<number>()
  let probe = lowestKnownPrid - 30   // start just below our lowest known

  let iterations = 0
  while (probe > PRID_FLOOR && iterations < 100) {
    iterations++
    const html   = await fetchIframeHtml(probe)
    const nearby = parsePridsFromHtml(html).filter(p => p < lowestKnownPrid)

    const before = collectedHindiPrids.size
    nearby.forEach(p => collectedHindiPrids.add(p))
    const added = collectedHindiPrids.size - before

    if (nearby.length > 0) {
      // Filter outliers: ignore PRIDs that are more than 500 below the current probe
      // (they're from a different category/date on a fallback page, not truly nearby)
      const nearbyFiltered = nearby.filter(p => p > probe - 500)
      const minFound = nearbyFiltered.length > 0
        ? Math.min(...nearbyFiltered)
        : probe - 200  // no valid nearby PRIDs, step back fixed amount
      console.log(`  Probe ${probe}: found ${nearby.length} PRIDs (${added} new), min=${minFound}`)
      probe = minFound - 30   // step back below the minimum found
    } else {
      // No PRIDs found — step back more aggressively
      probe -= 200
    }

    await new Promise(r => setTimeout(r, 200))
  }

  // ── Step 3: filter out already-stored PRIDs ───────────────────────────────
  const allPrids   = [...collectedHindiPrids].sort((a, b) => a - b)
  if (allPrids.length === 0) {
    console.log("  No new PRIDs discovered.")
    return { fetched: 0, saved: 0 }
  }

  const existingIds = await db.rawAnnouncement.findMany({
    where:  { source: "PIB", externalId: { in: allPrids.map(p => `hindi-${p}`) } },
    select: { externalId: true },
  })
  const existingSet = new Set(existingIds.map(r => r.externalId))
  const newPrids    = allPrids.filter(p => !existingSet.has(`hindi-${p}`))
  console.log(`  ${allPrids.length} Hindi PRIDs discovered, ${newPrids.length} new (${allPrids.length - newPrids.length} already in DB)`)

  if (newPrids.length === 0) return { fetched: 0, saved: 0 }

  // ── Step 4: fetch English siblings ───────────────────────────────────────
  console.log(`  Fetching English siblings for ${newPrids.length} PRIDs...`)
  const engPrids: (string | null)[] = []
  for (let i = 0; i < newPrids.length; i += 5) {
    const batch = newPrids.slice(i, i + 5)
    const results = await Promise.all(batch.map(p => fetchEnglishPrid(String(p))))
    engPrids.push(...results)
    if ((i + 5) % 50 === 0 || i + 5 >= newPrids.length) {
      process.stdout.write(`\r  English siblings: ${Math.min(i + 5, newPrids.length)}/${newPrids.length}`)
    }
  }
  console.log()

  // ── Step 5: fetch English bodies ─────────────────────────────────────────
  console.log(`  Fetching English bodies...`)
  const engBodies: (Awaited<ReturnType<typeof fetchEnglishBody>>)[] = []
  for (let i = 0; i < engPrids.length; i += 5) {
    const batch = engPrids.slice(i, i + 5)
    const results = await Promise.all(batch.map(p => p ? fetchEnglishBody(p) : Promise.resolve(null)))
    engBodies.push(...results)
    if ((i + 5) % 50 === 0 || i + 5 >= engPrids.length) {
      process.stdout.write(`\r  Bodies: ${Math.min(i + 5, engPrids.length)}/${engPrids.length}`)
    }
  }
  console.log()

  // ── Step 6: upsert ────────────────────────────────────────────────────────
  let saved = 0
  for (let i = 0; i < newPrids.length; i++) {
    const hindiPrid  = newPrids[i]
    const engPrid    = engPrids[i]
    const body       = engBodies[i]
    const externalId = `hindi-${hindiPrid}`

    if (!body?.body) continue   // skip if no English content

    const title  = body.title || `PIB press release ${hindiPrid}`
    const engUrl = engPrid ? ENG_BASE_URL + engPrid : null

    try {
      await db.rawAnnouncement.upsert({
        where:  { source_externalId: { source: "PIB", externalId } },
        create: {
          source:        "PIB",
          externalId,
          title:         title.slice(0, 500),
          body:          body.body.slice(0, 3000),
          attachmentUrl: engUrl,
          publishedAt:   new Date(),
        },
        update: {
          body:  body.body.slice(0, 3000),
          title: body.title ? body.title.slice(0, 500) : undefined,
        },
      })
      saved++
    } catch {
      // Duplicate key race
    }
  }

  return { fetched: newPrids.length, saved }
}
