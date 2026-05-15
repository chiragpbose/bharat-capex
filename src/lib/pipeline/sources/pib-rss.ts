/**
 * PIB (Press Information Bureau) press release fetcher.
 *
 * PIB's RSS only serves Hindi titles with no body. Strategy:
 *   1. Fetch Hindi RSS → get list of PRIDs
 *   2. For each PRID, fetch the IframePage to extract the English sibling PRID
 *      (it's linked as "English" in the page, offset is unpredictable)
 *   3. Fetch the English press release → extract title + body text
 *
 * Total: 1 + 20 + 20 = 41 requests per run. Parallelised in batches of 5.
 */

import { db } from "@/lib/db"

const HINDI_RSS   = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"
const IFRAME_BASE = "https://pib.gov.in/PressReleaseIframePage.aspx?PRID="
const ENG_BASE    = "https://pib.gov.in/PressReleasePage.aspx?PRID="

const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BharatCapex/1.0)" }

async function fetchHindiPrids(): Promise<{ prid: string; hindiTitle: string }[]> {
  const res = await fetch(HINDI_RSS, { headers: HEADERS, cache: "no-store" })
  if (!res.ok) throw new Error(`PIB RSS returned ${res.status}`)
  const xml = await res.text()
  const results: { prid: string; hindiTitle: string }[] = []
  for (const block of xml.split("<item>").slice(1)) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([^\]<\n]+)/)?.[1]?.trim() ?? ""
    const link  = block.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ?? ""
    const prid  = link.match(/PRID=(\d+)/)?.[1]
    if (prid) results.push({ prid, hindiTitle: title })
  }
  return results
}

async function fetchEnglishPrid(hindiPrid: string): Promise<string | null> {
  try {
    const res  = await fetch(IFRAME_BASE + hindiPrid, { headers: HEADERS })
    const html = await res.text()
    // The IframePage contains multiple PressReleasePage links (one per language sibling).
    // The English sibling always has a different PRID than the Hindi one.
    // Links look like: <a href='https://pib.gov.in/PressReleasePage.aspx?PRID=XXXXXX' target="_blank">
    const allMatches = [...html.matchAll(/PressReleasePage\.aspx\?PRID=(\d+)/gi)]
    const engPrid = allMatches.find((m) => m[1] !== hindiPrid)?.[1] ?? null
    return engPrid
  } catch {
    return null
  }
}

async function fetchEnglishBody(engPrid: string): Promise<{ title: string; body: string } | null> {
  try {
    const res  = await fetch(ENG_BASE + engPrid, { headers: HEADERS })
    const html = await res.text()
    // Strip scripts, styles, nav elements
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Extract title from heading
    const titleMatch = html.match(/class=["\']heading[^>]*>([^<]+)/i)
    const title = titleMatch?.[1]?.trim() ?? ""
    // Body: first 3000 chars of cleaned text (skipping nav boilerplate at top)
    const body  = clean.slice(0, 3000)

    return title ? { title, body } : null
  } catch {
    return null
  }
}

// Process in batches to avoid overwhelming the server
async function batchedMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize = 5
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(...await Promise.all(batch.map(fn)))
  }
  return results
}

export async function syncPibReleases(): Promise<{ fetched: number; saved: number }> {
  const hindiItems = await fetchHindiPrids()
  const fetched = hindiItems.length

  // Step 2: fetch English PRIDs in parallel batches
  const engPrids = await batchedMap(hindiItems, (item) => fetchEnglishPrid(item.prid))

  // Step 3: fetch English body in parallel batches
  const engBodies = await batchedMap(
    engPrids,
    (prid) => (prid ? fetchEnglishBody(prid) : Promise.resolve(null))
  )

  let saved = 0
  for (let i = 0; i < hindiItems.length; i++) {
    const engPrid = engPrids[i]
    const body    = engBodies[i]
    const externalId = `hindi-${hindiItems[i].prid}`

    const title = body?.title || hindiItems[i].hindiTitle  // fall back to Hindi if English fails
    const engUrl = engPrid ? ENG_BASE + engPrid : null

    try {
      await db.rawAnnouncement.upsert({
        where:  { source_externalId: { source: "PIB", externalId } },
        create: {
          source:       "PIB",
          externalId,
          title:        title.slice(0, 500),
          body:         body?.body?.slice(0, 3000) ?? null,
          attachmentUrl: engUrl,
          publishedAt:  new Date(),
        },
        update: {}, // idempotent — don't overwrite if already processed
      })
      saved++
    } catch {
      // Duplicate key race — safe to ignore
    }
  }

  return { fetched, saved }
}
