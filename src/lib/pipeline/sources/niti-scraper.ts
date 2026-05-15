/**
 * NITI Aayog publications scraper.
 *
 * Why NITI Aayog matters for BharatCapex:
 *   NITI Aayog is the government's strategic planning body — its publications
 *   (strategy papers, working papers, sector roadmaps) signal POLICY INTENT
 *   before formal scheme notifications. A NITI paper on semiconductor self-
 *   sufficiency → precedes the PLI scheme by 6–18 months. These are among the
 *   earliest leading indicators in the reform chain.
 *
 *   Examples of high-signal NITI documents:
 *   - "Viksit Bharat 2047" strategy document
 *   - Sector-specific reports (EV ecosystem, green hydrogen, nuclear)
 *   - State fiscal health index (drives state capex allocation thesis)
 *   - Trade Watch quarterly (export sector opportunity sizing)
 *
 * Scraping approach:
 *   NITI's What's New page is server-rendered Drupal HTML. No JS needed.
 *   Pattern: /whats-new/[slug]" >[title] — parseable with regex.
 */

import { db } from "@/lib/db"

const NITI_WHATS_NEW    = "https://www.niti.gov.in/whats-new"
const NITI_BASE         = "https://www.niti.gov.in"
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BharatCapex/1.0)" }

type NitiItem = {
  slug:  string
  title: string
  url:   string
}

async function fetchNitiItems(): Promise<NitiItem[]> {
  const res = await fetch(NITI_WHATS_NEW, { headers: HEADERS, cache: "no-store" })
  if (!res.ok) throw new Error(`NITI Aayog returned ${res.status}`)
  const html = await res.text()

  const items: NitiItem[] = []
  // Pattern: href="/whats-new/slug">Title text
  for (const m of html.matchAll(/href="(\/whats-new\/[^"]+)"[^>]*>([^<]{10,200})/g)) {
    const slug  = m[1].replace("/whats-new/", "").trim()
    const title = m[2].replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim()

    // Skip navigation links and non-content items
    if (!slug || !title || slug.includes("?") || slug.includes("#")) continue

    items.push({ slug, title, url: NITI_BASE + m[1] })
  }

  // Deduplicate by slug
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.slug)) return false
    seen.add(item.slug)
    return true
  })
}

export async function syncNitiAayog(): Promise<{ fetched: number; saved: number }> {
  let items: NitiItem[] = []
  try {
    items = await fetchNitiItems()
  } catch (err) {
    console.error("NITI Aayog fetch failed:", err)
    return { fetched: 0, saved: 0 }
  }

  const fetched = items.length
  let saved = 0

  for (const item of items) {
    try {
      await db.rawAnnouncement.upsert({
        where:  { source_externalId: { source: "NITI_AAYOG", externalId: item.slug } },
        create: {
          source:        "NITI_AAYOG",
          externalId:    item.slug,
          title:         item.title.slice(0, 500),
          body:          null,
          attachmentUrl: item.url,
          publishedAt:   new Date(),
        },
        update: {},
      })
      saved++
    } catch {
      // Duplicate — safe to ignore
    }
  }

  return { fetched, saved }
}
