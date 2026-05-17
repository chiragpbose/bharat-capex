/**
 * NSE corporate announcements fetcher.
 *
 * Why NSE instead of BSE:
 *   BSE's API requires a browser-generated session token (Akamai bot protection).
 *   NSE's equivalent endpoint works with a single homepage fetch for cookies —
 *   no Playwright needed. The data is identical: companies file with both exchanges.
 *
 * Auth flow:
 *   1. Fetch nseindia.com homepage → get Akamai session cookie (ak_bmsc etc.)
 *   2. Use that cookie for the API call — valid for the duration of the run
 *
 * Fields used:
 *   symbol        → matches Company.tickerNse directly
 *   attchmntText  → one-sentence description of the filing (signal matching + extraction)
 *   attchmntFile  → PDF URL (fetched separately for deep extraction if needed)
 *   seq_id        → unique announcement ID (used as externalId)
 *   sm_isin       → ISIN (fallback company lookup)
 */

import { db } from "@/lib/db"

const NSE_HOME  = "https://www.nseindia.com/"
const NSE_API   = "https://www.nseindia.com/api/corporate-announcements"
const UA        = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// Broad signal keywords — Claude extraction does the real filtering
const SIGNAL_KEYWORDS = [
  "order", "contract", "capex", "capacity", "award", "wins", "bags",
  "secures", "clinches", "expansion", "investment", "project", "tender",
  "loa", "letter of award", "mandate", "greenfield", "plant",
  "infrastructure", "scheme", "₹", "crore", "billion",
]

// NSE `desc` categories that are categorically never capex signals.
// This denylist works at the *category* level (not content) — safe to exclude.
const DENYLIST_DESC = [
  "surveillance", "esop", "agm", "egm", "dividend",
  "financial results", "board meeting", "change in directors",
  "appointment", "resignation", "compliance", "buyback",
  "insider trading", "corporate governance", "analyst meet",
  "shareholding", "credit rating", "record date",
]

type NseAnnouncement = {
  symbol:       string
  desc:         string
  attchmntText: string | null
  attchmntFile: string | null
  sm_name:      string
  sm_isin:      string | null
  an_dt:        string
  sort_date:    string
  seq_id:       string
  smIndustry:   string | null
}

function toNseDateParam(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yy = d.getFullYear()
  return `${dd}-${mm}-${yy}`
}

export function isSignal(annDesc: string, signalText: string): boolean {
  const descLower = annDesc.toLowerCase()
  if (DENYLIST_DESC.some((d) => descLower.includes(d))) return false

  const lower = signalText.toLowerCase()
  return SIGNAL_KEYWORDS.some((kw) => lower.includes(kw))
}

function fetchWithTimeout(url: string, options: RequestInit, ms = 30_000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export async function getSessionCookies(): Promise<string> {
  const res = await fetchWithTimeout(NSE_HOME, {
    headers: { "User-Agent": UA, "Accept": "text/html" },
    cache: "no-store",
  })
  const cookies = res.headers.getSetCookie?.() ?? []
  return cookies.map((c) => c.split(";")[0]).join("; ")
}

export async function fetchAnnouncements(cookies: string, fromDate: Date, toDate: Date): Promise<NseAnnouncement[]> {
  const from = toNseDateParam(fromDate)
  const to   = toNseDateParam(toDate)
  const url  = `${NSE_API}?index=equities&from_date=${from}&to_date=${to}`

  const res = await fetchWithTimeout(url, {
    headers: {
      "User-Agent":  UA,
      "Accept":      "application/json",
      "Referer":     NSE_HOME,
      "Cookie":      cookies,
    },
    cache: "no-store",
  })

  if (!res.ok) throw new Error(`NSE API returned ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function syncNseAnnouncements(date?: Date): Promise<{ fetched: number; saved: number }> {
  const today     = date ?? new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Load tracked companies keyed by NSE ticker
  const companies = await db.company.findMany({
    where:  { tickerNse: { not: null } },
    select: { id: true, tickerNse: true },
  })
  const byTicker = new Map(companies.map((c) => [c.tickerNse!, c.id]))

  const cookies      = await getSessionCookies()
  const announcements = await fetchAnnouncements(cookies, yesterday, today)
  const fetched       = announcements.length

  let saved = 0
  for (const ann of announcements) {
    const companyId  = byTicker.get(ann.symbol) ?? null
    const signalText = ann.attchmntText ?? ann.desc ?? ""

    // Store if: tracked company OR signal phrase in description (after denylist check)
    if (!companyId && !isSignal(ann.desc ?? "", signalText)) continue

    let publishedAt: Date
    try {
      publishedAt = ann.sort_date ? new Date(ann.sort_date) : new Date()
      if (isNaN(publishedAt.getTime())) publishedAt = new Date()
    } catch {
      publishedAt = new Date()
    }

    try {
      await db.rawAnnouncement.upsert({
        where:  { source_externalId: { source: "NSE", externalId: ann.seq_id } },
        create: {
          source:        "NSE",
          externalId:    ann.seq_id,
          companyId,
          title:         signalText.slice(0, 500) || ann.desc,
          attachmentUrl: ann.attchmntFile ?? null,
          publishedAt,
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
