/**
 * Daily pipeline runner.
 *
 * Usage:  npm run pipeline:run
 *         tsx src/lib/pipeline/run.ts
 *
 * Dynamic imports are required here: static `import` statements compile to
 * CJS `require()` calls that run before any code, so `dotenv.config()` would
 * fire too late and the DB singleton would initialise with no DATABASE_URL.
 * Dynamic `import()` is a runtime call — it runs after dotenv has loaded env.
 */

// Must be first — before any module that uses process.env
import * as dotenv from "dotenv"
dotenv.config()

async function main() {
  // Dynamic imports: modules (and their DB singleton) instantiate here,
  // after dotenv.config() has populated process.env.
  const { syncNseAnnouncements }        = await import("./sources/nse-filings")
  const { syncNewsFeeds }               = await import("./sources/news-rss")
  const { syncPibReleases }             = await import("./sources/pib-rss")
  const { syncNitiAayog }               = await import("./sources/niti-scraper")
  const { syncCpppTenders }             = await import("./sources/cppp-scraper")
  const { processPendingAnnouncements } = await import("./extract/extract-announcement")

  console.log("── NSE corporate filings ─────────────────────")
  const nse = await syncNseAnnouncements()
  console.log(`Fetched ${nse.fetched} filings, stored ${nse.saved} signal rows`)

  console.log("\n── News RSS (ET, BS, Mint) ───────────────────")
  const news = await syncNewsFeeds()
  console.log(`Fetched ${news.fetched} articles, stored ${news.saved} signal rows`)

  console.log("\n── PIB press releases ────────────────────────")
  const pib = await syncPibReleases()
  console.log(`Fetched ${pib.fetched} releases, stored ${pib.saved} rows`)

  console.log("\n── NITI Aayog publications ───────────────────")
  const niti = await syncNitiAayog()
  console.log(`Fetched ${niti.fetched} items, stored ${niti.saved} rows`)

  console.log("\n── CPPP high-value tenders ───────────────────")
  const cppp = await syncCpppTenders()
  console.log(`Fetched ${cppp.fetched} tenders, stored ${cppp.saved} rows`)

  console.log("\n── Claude extraction ─────────────────────────")
  const processed = await processPendingAnnouncements(50)
  console.log(`Processed ${processed} announcements`)

  console.log("\n✓ Pipeline complete")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
