import Link from "next/link"
import { getAllSectors } from "@/lib/data/sectors"
import { getReforms } from "@/lib/data/reforms"
import { getCompanies } from "@/lib/data/companies"
import { getTenders } from "@/lib/data/tenders"

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

const STATUS_STYLES = {
  PROPOSED:    "bg-amber-50 text-amber-700 border-amber-200",
  NOTIFIED:    "bg-sky-50 text-sky-700 border-sky-200",
  IMPLEMENTED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OPERATIONAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  STALLED:     "bg-rose-50 text-rose-700 border-rose-200",
  REVERSED:    "bg-red-50 text-red-700 border-red-200",
  AWARDED:     "bg-blue-50 text-blue-700 border-blue-200",
} as const

export default async function HomePage() {
  const [sectors, reforms, companies, tenders] = await Promise.all([
    getAllSectors(),
    getReforms(),
    getCompanies(),
    getTenders(),
  ])

  // Header stats derived from real DB data
  const totalCapexCrore    = sectors.reduce((s, sec) => s + (sec.govtOutlayCrore ?? 0), 0)
  const totalFdiCrore      = reforms.reduce((s, r)   => s + (r.fdiCommittedCrore ?? 0), 0)
  const avgOrderBookGrowth = companies.length > 0
    ? Math.round(companies.reduce((s, c) => s + (c.revenueGrowthPct ?? 0), 0) / companies.length)
    : 0

  // Unified date-sorted activity feed
  type FeedItem =
    | { kind: "tender"; date: Date; data: (typeof tenders)[number] }
    | { kind: "reform"; date: Date; data: (typeof reforms)[number] }

  const feed: FeedItem[] = [
    ...tenders
      .filter((t) => t.awardedAt)
      .map((t) => ({ kind: "tender" as const, date: t.awardedAt!, data: t })),
    ...reforms
      .filter((r) => r.notifiedAt)
      .map((r) => ({ kind: "reform" as const, date: r.notifiedAt!, data: r })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  // Highlight signals
  const topTender = tenders[0]
  const topReform = reforms.find((r) => r.status === "NOTIFIED" || r.status === "PROPOSED")
  const topSector = [...sectors].sort((a, b) => (b.govtOutlayCrore ?? 0) - (a.govtOutlayCrore ?? 0))[0]

  // For sector bars
  const maxGovt = Math.max(...sectors.map((s) => s.govtOutlayCrore ?? 0), 1)
  const maxOB   = Math.max(...sectors.map((s) => s.orderBookCrore   ?? 0), 1)

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">

      {/* ── Slim header strip ── */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b">
        <div>
          <p className="text-xs font-medium tracking-widest text-blue-600 uppercase mb-2">
            India&apos;s Industrial Buildout
          </p>
          <h1 className="font-display text-3xl tracking-tight leading-tight max-w-lg">
            Every policy, tender, and company{" "}
            <span className="text-blue-600">powering India&apos;s capex cycle.</span>
          </h1>
        </div>
        <div className="flex gap-6 shrink-0">
          {[
            { value: fmt(totalCapexCrore),            label: "capex tracked",    color: "text-blue-600" },
            { value: fmt(totalFdiCrore),              label: "FDI committed",    color: "text-emerald-600" },
            { value: `+${avgOrderBookGrowth}%`,       label: "avg order growth", color: "text-sky-600" },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-right">
              <p className={`font-display text-xl tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── This week — 3 highlight cards ── */}
      {(topTender || topReform || topSector) && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            This Week&apos;s Signals
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">

            {/* Biggest tender */}
            {topTender && (
              <Link href={`/companies/${topTender.company.slug}`}
                className="group border rounded-xl p-5 bg-card hover:shadow-md transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none bg-emerald-500" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 inline-block mb-3">
                  Tender Awarded
                </span>
                <p className="text-sm font-semibold leading-snug group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                  {topTender.title}
                </p>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="font-display text-2xl text-emerald-700">{fmt(topTender.valueCrore ?? 0)}</p>
                    {topTender.completionMonths && (
                      <p className="text-xs text-muted-foreground">{topTender.completionMonths}mo delivery</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground border rounded px-2 py-0.5">
                    {topTender.company.tickerNse}
                  </span>
                </div>
              </Link>
            )}

            {/* Latest reform move */}
            {topReform && (
              <Link href={`/reforms/${topReform.slug}`}
                className="group border rounded-xl p-5 bg-card hover:shadow-md transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none bg-sky-500" />
                <span className={`text-[10px] font-semibold uppercase tracking-widest rounded px-2 py-0.5 inline-block mb-3 border ${STATUS_STYLES[topReform.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.PROPOSED}`}>
                  Reform · {topReform.status.charAt(0) + topReform.status.slice(1).toLowerCase()}
                </span>
                <p className="text-sm font-semibold leading-snug group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                  {topReform.title}
                </p>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    {topReform.budgetOutlayCrore && (
                      <>
                        <p className="font-display text-2xl text-violet-700">{fmt(topReform.budgetOutlayCrore)}</p>
                        <p className="text-xs text-muted-foreground">budget outlay</p>
                      </>
                    )}
                  </div>
                  <span className="text-xs font-medium border rounded px-2 py-0.5"
                    style={{ color: topReform.sector.color ?? undefined }}>
                    {topReform.sector.name}
                  </span>
                </div>
              </Link>
            )}

            {/* Hottest sector */}
            {topSector && (
              <Link href={`/companies?sectorSlug=${topSector.slug}`}
                className="group border rounded-xl p-5 bg-card hover:shadow-md transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
                  style={{ backgroundColor: topSector.color ?? undefined }} />
                <span className="text-[10px] font-semibold uppercase tracking-widest rounded px-2 py-0.5 inline-block mb-3 border"
                  style={{ color: topSector.color ?? undefined, borderColor: `${topSector.color}50`, backgroundColor: `${topSector.color}12` }}>
                  Sector Spotlight
                </span>
                <p className="text-sm font-semibold leading-snug group-hover:text-blue-600 transition-colors mb-2">
                  {topSector.name}
                </p>
                <div className="flex items-end justify-between mt-3">
                  <div>
                    <p className="font-display text-2xl" style={{ color: topSector.color ?? undefined }}>{fmt(topSector.govtOutlayCrore ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">govt outlay</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground border rounded px-2 py-0.5">
                    {topSector.companiesCount ?? "—"} cos
                  </span>
                </div>
              </Link>
            )}

          </div>
        </section>
      )}

      {/* ── Activity feed ── */}
      {feed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Latest Activity
            </h2>
            <div className="flex gap-3">
              <Link href="/tenders" className="text-xs text-blue-600 hover:underline underline-offset-2">Tenders →</Link>
              <Link href="/reforms" className="text-xs text-blue-600 hover:underline underline-offset-2">Reforms →</Link>
            </div>
          </div>

          <div className="divide-y border rounded-xl overflow-hidden bg-card">
            {feed.slice(0, 8).map((item, i) => {
              if (item.kind === "tender") {
                const t = item.data
                return (
                  <div key={`t-${i}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">
                      {fmtDate(item.date)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 shrink-0">
                      Tender
                    </span>
                    <p className="text-sm flex-1 line-clamp-1 min-w-0">{t.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold tabular-nums text-emerald-700">{fmt(t.valueCrore ?? 0)}</span>
                      <Link href={`/companies/${t.company.slug}`}
                        className="text-[10px] font-medium border rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors">
                        {t.company.tickerNse}
                      </Link>
                    </div>
                  </div>
                )
              }

              const r = item.data
              return (
                <Link key={`r-${i}`} href={`/reforms/${r.slug}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <span className="text-[10px] text-muted-foreground tabular-nums w-12 shrink-0">
                    {fmtDate(item.date)}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 shrink-0 border ${STATUS_STYLES[r.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.PROPOSED}`}>
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                  <p className="text-sm flex-1 line-clamp-1 min-w-0">{r.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.budgetOutlayCrore && (
                      <span className="text-xs font-bold tabular-nums text-violet-700">{fmt(r.budgetOutlayCrore)}</span>
                    )}
                    <span className="text-[10px] font-medium border rounded px-1.5 py-0.5"
                      style={{ color: r.sector.color ?? undefined }}>
                      {r.sector.name.split(" ")[0]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Sectors strip ── */}
      {sectors.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Sectors</h2>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-blue-400 inline-block" />
                Govt outlay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-emerald-400 inline-block" />
                Listed co. order book
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[...sectors].sort((a, b) => (b.govtOutlayCrore ?? 0) - (a.govtOutlayCrore ?? 0)).map((sector) => {
              const govtPct = ((sector.govtOutlayCrore ?? 0) / maxGovt) * 100
              const obPct   = ((sector.orderBookCrore   ?? 0) / maxOB)  * 100
              return (
                <Link key={sector.id} href={`/companies?sectorSlug=${sector.slug}`}
                  className="grid gap-y-1 group"
                  style={{ gridTemplateColumns: "10rem 1fr" }}>

                  <div className="flex items-center gap-2 row-span-2 self-center pr-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sector.color ?? undefined }} />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {sector.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${govtPct}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-blue-600 font-medium w-16 text-right shrink-0">
                      {fmt(sector.govtOutlayCrore ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${obPct}%` }} />
                    </div>
                    <span className="text-[10px] tabular-nums text-emerald-700 font-medium w-16 text-right shrink-0">
                      {fmt(sector.orderBookCrore ?? 0)}
                    </span>
                  </div>

                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Featured Companies ── */}
      {companies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Company Movers
            </h2>
            <Link href="/companies" className="text-xs text-blue-600 hover:underline underline-offset-2">
              All companies →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {companies.map((co) => {
              const primarySector = co.sectors[0]?.sector
              return (
                <Link
                  key={co.id}
                  href={`/companies/${co.slug}`}
                  className="group border rounded-xl p-4 hover:shadow-md transition-all bg-card overflow-hidden"
                  style={{ borderLeftColor: primarySector?.color ?? undefined, borderLeftWidth: "3px" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{co.name}</p>
                      <p className="text-xs text-muted-foreground">{co.tickerNse} · NSE</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border tabular-nums ${
                      (co.revenueGrowthPct ?? 0) > 15
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-sky-700 bg-sky-50 border-sky-200"
                    }`}>
                      +{co.revenueGrowthPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-3 text-center">
                    <div className="bg-muted/50 rounded-lg py-1.5 px-1">
                      <p className="text-xs font-bold tabular-nums">{fmt(co.revenueCrore ?? 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-1.5 px-1">
                      <p className="text-xs font-bold tabular-nums">{fmt(co.orderBookCrore ?? 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Order Book</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-1.5 px-1">
                      <p className={`text-xs font-bold tabular-nums ${(co.roce ?? 0) > 20 ? "text-emerald-700" : ""}`}>
                        {co.roce}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">ROCE</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 italic">{co.recentWin}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

    </main>
  )
}
