/**
 * BSE corporate announcements fetcher.
 *
 * ⚠️  BSE's JSON API (api.bseindia.com) requires a browser-generated session key
 *     ("mykey") that Akamai bot-protection sets only after JavaScript execution.
 *     Raw fetch calls return empty rows.
 *
 * Current approach: skip for now. Replace this file with a Playwright-based
 * scraper when needed. The rest of the pipeline (news-rss.ts → extract) will
 * cover order-win signals in the meantime.
 *
 * TODO: Playwright scraper
 *   1. launch browser, navigate to https://www.bseindia.com/corporates/ann.html
 *   2. wait for network idle → grab the mykey cookie / XHR response
 *   3. filter by tracked company BSE codes + signal keywords
 *   4. upsert to RawAnnouncement
 */

import { db } from "@/lib/db"

// Signal keywords — announcements matching these are worth storing
const SIGNAL_KEYWORDS = [
  "order", "contract", "wins", "awarded", "award", "loa", "letter of award",
  "project", "capex", "capacity", "expansion", "investment", "tender",
  "secures", "bags", "clinches", "mandate",
]

export function hasSignal(headline: string): boolean {
  const lower = headline.toLowerCase()
  return SIGNAL_KEYWORDS.some((kw) => lower.includes(kw))
}

// Placeholder — wired to the same RawAnnouncement model the rest of the pipeline uses.
// Replace the body with real scraping logic when ready.
export async function syncBseAnnouncements(_date?: Date): Promise<{ fetched: number; saved: number }> {
  void db // imported to keep the dependency graph consistent
  console.warn("BSE scraper not yet implemented — needs Playwright for session auth")
  return { fetched: 0, saved: 0 }
}
