/**
 * NSE historical backfill.
 *
 * The NSE corporate announcements API supports arbitrary date ranges.
 * We iterate week by week (smaller chunks = more reliable, avoids large payloads)
 * and upsert all signal-matching filings from the past N months.
 *
 * Cookies are refreshed every 10 weeks to avoid session expiry.
 * Rate limiting: 1s delay between weekly calls so NSE doesn't block us.
 */

import { db } from "@/lib/db"
import { getSessionCookies, fetchAnnouncements, isSignal } from "./nse-filings"

export async function backfillNse(
  lookbackMonths = 12,
): Promise<{ fetched: number; saved: number }> {
  const today    = new Date()
  const fromDate = new Date(today)
  fromDate.setMonth(fromDate.getMonth() - lookbackMonths)

  // Build list of weekly windows, oldest → newest
  const windows: { from: Date; to: Date }[] = []
  const cursor = new Date(fromDate)
  while (cursor < today) {
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 7)
    windows.push({ from: new Date(cursor), to: weekEnd > today ? new Date(today) : new Date(weekEnd) })
    cursor.setDate(cursor.getDate() + 7)
  }

  console.log(`  ${windows.length} weekly windows from ${fromDate.toDateString()} → today`)

  // Load company ticker map once
  const companies = await db.company.findMany({
    where:  { tickerNse: { not: null } },
    select: { id: true, tickerNse: true },
  })
  const byTicker = new Map(companies.map(c => [c.tickerNse!, c.id]))

  let cookies      = await getSessionCookies()
  let totalFetched = 0
  let totalSaved   = 0

  for (let i = 0; i < windows.length; i++) {
    const { from, to } = windows[i]

    // Refresh cookies every 10 weeks (sessions expire after ~15 min of inactivity)
    if (i > 0 && i % 10 === 0) {
      cookies = await getSessionCookies()
    }

    let announcements
    try {
      announcements = await fetchAnnouncements(cookies, from, to)
    } catch (err) {
      console.log(`\n  ⚠ Week ${i + 1} failed (${from.toDateString()}): ${err} — retrying with fresh cookies`)
      cookies = await getSessionCookies()
      try {
        announcements = await fetchAnnouncements(cookies, from, to)
      } catch {
        console.log(`  ✗ Week ${i + 1} skipped after retry`)
        continue
      }
    }

    totalFetched += announcements.length
    let weekSaved = 0

    for (const ann of announcements) {
      const companyId  = byTicker.get(ann.symbol) ?? null
      const signalText = ann.attchmntText ?? ann.desc ?? ""

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
            title:         (signalText || ann.desc).slice(0, 500),
            attachmentUrl: ann.attchmntFile ?? null,
            publishedAt,
          },
          update: {},
        })
        weekSaved++
      } catch {
        // Duplicate — safe to ignore
      }
    }

    totalSaved += weekSaved
    process.stdout.write(
      `\r  Week ${String(i + 1).padStart(3)}/${windows.length}  ` +
      `${from.toISOString().slice(0, 10)}  ` +
      `fetched ${announcements.length}, saved ${weekSaved} signals  ` +
      `(total: ${totalSaved})`
    )

    // Polite delay — avoid hammering NSE
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log()
  return { fetched: totalFetched, saved: totalSaved }
}
