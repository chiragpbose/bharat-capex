import { db } from "@/lib/db"

// Active feeds confirmed working as of May 2026
const FEEDS = [
  { label: "ET_MARKETS",  url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"  },
  { label: "ET_STOCKS",   url: "https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms" },
  { label: "ET_INDUSTRY", url: "https://economictimes.indiatimes.com/industry/rssfeeds/13352306.cms"   },
  { label: "BS_MARKETS",  url: "https://www.business-standard.com/rss/markets-106.rss"                 },
  { label: "MINT_COS",    url: "https://www.livemint.com/rss/companies"                                },
] as const

// Broad signal keywords — Claude extraction does the real filtering
const SIGNAL_KEYWORDS = [
  "order", "contract", "capex", "capacity", "expansion", "investment",
  "tender", "loa", "plant", "greenfield", "infrastructure", "wins", "bags",
  "secures", "clinches", "award", "backlog", "order book", "project",
  "crore", "billion", "capital expenditure",
]

// Rupee amount with unit — a standalone "₹" is too broad (e.g. "₹3/litre tax")
const RUPEE_AMOUNT_RE = /₹\s*\d+(\.\d+)?\s*(crore|lakh|billion|mn|cr\b)/i

function isSignal(title: string, description?: string): boolean {
  const text = `${title} ${description ?? ""}`.toLowerCase()
  if (SIGNAL_KEYWORDS.some((kw) => text.includes(kw))) return true
  if (RUPEE_AMOUNT_RE.test(`${title} ${description ?? ""}`)) return true
  return false
}

type RssItem = {
  guid:        string
  title:       string
  link:        string
  description: string
  pubDate:     string
  source:      string
}

function extractCdata(raw: string): string {
  return raw.replace(/<!\[CDATA\[|\]\]>/g, "").trim()
}

async function fetchFeed(label: string, url: string): Promise<RssItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BharatCapex/1.0)" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`)
  const xml = await res.text()

  const items: RssItem[] = []
  for (const block of xml.split("<item>").slice(1)) {
    const title       = extractCdata(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")
    const link        = extractCdata(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "")
    const guid        = extractCdata(block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? link)
    const description = extractCdata(block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "")
    const pubDate     = extractCdata(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "")

    if (title && guid) items.push({ guid, title, link, description, pubDate, source: label })
  }
  return items
}

export async function syncNewsFeeds(): Promise<{ fetched: number; saved: number }> {
  let fetched = 0
  let saved   = 0

  for (const feed of FEEDS) {
    let items: RssItem[] = []
    try {
      items = await fetchFeed(feed.label, feed.url)
      fetched += items.length
    } catch (err) {
      console.error(`Failed to fetch ${feed.label}:`, err)
      continue
    }

    for (const item of items) {
      if (!isSignal(item.title, item.description)) continue

      let publishedAt: Date
      try {
        publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
        if (isNaN(publishedAt.getTime())) publishedAt = new Date()
      } catch {
        publishedAt = new Date()
      }

      try {
        await db.rawAnnouncement.upsert({
          where:  { source_externalId: { source: item.source, externalId: item.guid } },
          create: {
            source:       item.source,
            externalId:   item.guid,
            title:        item.title.slice(0, 500),
            body:         item.description.slice(0, 2000) || null,
            attachmentUrl: item.link || null,
            publishedAt,
          },
          update: {}, // idempotent
        })
        saved++
      } catch {
        // Duplicate key race — safe to ignore
      }
    }
  }

  return { fetched, saved }
}
