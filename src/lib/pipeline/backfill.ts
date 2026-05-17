/**
 * One-time historical backfill.
 *
 * Usage:
 *   npm run pipeline:backfill                   # NSE 12 months + PIB 30 days
 *   npm run pipeline:backfill -- --nse-months=6  # NSE 6 months only
 *   npm run pipeline:backfill -- --pib-days=60   # PIB 60 days only
 *   npm run pipeline:backfill -- --pib-only
 *   npm run pipeline:backfill -- --nse-only
 */

import * as dotenv from "dotenv"
dotenv.config()

const args         = process.argv.slice(2)
const nseMonths    = parseInt(args.find(a => a.startsWith("--nse-months="))?.split("=")[1] ?? "12")
const pibDays      = parseInt(args.find(a => a.startsWith("--pib-days="))?.split("=")[1] ?? "30")
const nseOnly      = args.includes("--nse-only")
const pibOnly      = args.includes("--pib-only")
const runNse       = !pibOnly
const runPib       = !nseOnly

async function main() {
  let totalNewRows = 0

  // ── NSE ─────────────────────────────────────────────────────────────────
  if (runNse) {
    console.log(`\n── NSE backfill (last ${nseMonths} months) ──────────────────────`)
    const { backfillNse } = await import("./sources/nse-backfill")
    const nse = await backfillNse(nseMonths)
    console.log(`  Done — fetched ${nse.fetched.toLocaleString()} filings, saved ${nse.saved.toLocaleString()} new signal rows`)
    totalNewRows += nse.saved
  }

  // ── PIB ─────────────────────────────────────────────────────────────────
  if (runPib) {
    console.log(`\n── PIB backfill (last ${pibDays} days) ──────────────────────────`)
    const { backfillPib } = await import("./sources/pib-backfill")
    const pib = await backfillPib(pibDays)
    console.log(`  Done — fetched ${pib.fetched} new releases, saved ${pib.saved} rows`)
    totalNewRows += pib.saved
  }

  // ── Extraction (Batches API — 50% off + prompt caching) ──────────────────
  console.log(`\n── Claude extraction (Batches API) ──────────────────`)
  const { runBatchExtraction } = await import("./extract/batch-extract")
  const processed = await runBatchExtraction()
  console.log(`  Done — ${processed} rows extracted`)

  console.log("\n✓ Backfill complete")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
