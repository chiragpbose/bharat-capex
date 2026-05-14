import Link from "next/link"
import { SECTORS, COMPANIES } from "@/lib/seed-data"

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

export const metadata = { title: "Companies" }

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ sectorSlug?: string; q?: string }>
}) {
  const { sectorSlug, q } = await searchParams

  const activeSector = sectorSlug
    ? SECTORS.find((s) => s.slug === sectorSlug)
    : null

  const filtered = COMPANIES.filter((co) => {
    if (activeSector && !co.sectors.some((s) => {
      const sec = SECTORS.find((x) => x.name === s)
      return sec?.slug === sectorSlug
    })) return false
    if (q) {
      const lower = q.toLowerCase()
      return (
        co.name.toLowerCase().includes(lower) ||
        co.tickerNse.toLowerCase().includes(lower) ||
        co.sectors.some((s) => s.toLowerCase().includes(lower))
      )
    }
    return true
  })

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium tracking-widest text-blue-600 uppercase mb-2">Company Intelligence</p>
        <h1 className="font-display text-4xl tracking-tight mb-1">
          {activeSector ? activeSector.name : "All Companies"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {activeSector
            ? `${activeSector.companiesCount} companies · ${fmt(activeSector.govtOutlayCrore)} govt outlay · ${fmt(activeSector.orderBookCrore)} order book`
            : `${COMPANIES.length} companies tracked across ${SECTORS.length} sectors`}
        </p>
      </div>

      {/* Sector filter strip */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/companies"
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            !activeSector
              ? "bg-blue-600 text-white border-blue-600"
              : "text-muted-foreground border hover:text-foreground hover:border-foreground/30"
          }`}
        >
          All sectors
        </Link>
        {SECTORS.map((sector) => (
          <Link
            key={sector.id}
            href={`/companies?sectorSlug=${sector.slug}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              activeSector?.id === sector.id
                ? "text-white border-transparent"
                : "text-muted-foreground border hover:border-foreground/30"
            }`}
            style={
              activeSector?.id === sector.id
                ? { backgroundColor: sector.color, borderColor: sector.color }
                : {}
            }
          >
            {sector.name}
          </Link>
        ))}
      </div>

      {/* Results count + search hint */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "company" : "companies"}
          {q ? ` matching "${q}"` : ""}
        </p>
        {q && (
          <Link href={activeSector ? `/companies?sectorSlug=${sectorSlug}` : "/companies"}
            className="text-xs text-blue-600 hover:underline">
            Clear search
          </Link>
        )}
      </div>

      {/* Company grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No companies match the current filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((co) => {
            const primarySector = SECTORS.find((x) => x.name === co.sectors[0])
            return (
              <Link
                key={co.id}
                href={`/companies/${co.slug}`}
                className="group border rounded-xl p-4 hover:shadow-md transition-all bg-card overflow-hidden"
                style={{ borderLeftColor: primarySector?.color, borderLeftWidth: "3px" }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{co.name}</p>
                    <p className="text-xs text-muted-foreground">{co.tickerNse} · NSE</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border tabular-nums ${
                      co.revenueGrowthPct > 15
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-sky-700 bg-sky-50 border-sky-200"
                    }`}>
                      +{co.revenueGrowthPct}% rev
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {fmt(co.marketCapCrore)} mcap
                    </span>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-muted/50 rounded-lg py-1.5 px-1">
                    <p className="text-xs font-bold tabular-nums">{fmt(co.revenueCrore)}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Revenue</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg py-1.5 px-1">
                    <p className="text-xs font-bold tabular-nums">{fmt(co.orderBookCrore)}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Order Book</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg py-1.5 px-1">
                    <p className={`text-xs font-bold tabular-nums ${co.roce > 20 ? "text-emerald-700" : "text-foreground"}`}>
                      {co.roce}%
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">ROCE</p>
                  </div>
                </div>

                {/* Secondary metrics */}
                <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                  <span>PAT <span className="font-medium text-foreground">{fmt(co.patCrore)}</span></span>
                  <span>·</span>
                  <span>D/E <span className={`font-medium ${co.debtEquityRatio < 0.5 ? "text-emerald-700" : co.debtEquityRatio > 1.5 ? "text-rose-700" : "text-foreground"}`}>{co.debtEquityRatio}x</span></span>
                </div>

                {/* Capex plan */}
                {co.capexPlannedCrore && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-violet-700">{fmt(co.capexPlannedCrore)}</span>
                    {" "}capex planned
                  </p>
                )}

                {/* Sector tags */}
                <div className="flex flex-wrap gap-1">
                  {co.sectors.slice(0, 2).map((s) => {
                    const sector = SECTORS.find((x) => x.name === s)
                    return (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 rounded-full border font-medium"
                        style={sector ? { color: sector.color, borderColor: `${sector.color}50`, backgroundColor: `${sector.color}0d` } : {}}
                      >
                        {s}
                      </span>
                    )
                  })}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Sector stats bar */}
      <section className="mt-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Sector Overview</h2>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-blue-400 inline-block" />Govt outlay</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-emerald-400 inline-block" />Order book</span>
          </div>
        </div>
        <div className="space-y-3">
          {[...SECTORS].sort((a, b) => b.govtOutlayCrore - a.govtOutlayCrore).map((sector) => {
            const maxGovt = Math.max(...SECTORS.map((s) => s.govtOutlayCrore))
            const maxOB   = Math.max(...SECTORS.map((s) => s.orderBookCrore))
            const govtPct = (sector.govtOutlayCrore / maxGovt) * 100
            const obPct   = (sector.orderBookCrore   / maxOB)   * 100
            return (
              <Link key={sector.id} href={`/companies?sectorSlug=${sector.slug}`}
                className="grid gap-y-1 group"
                style={{ gridTemplateColumns: "10rem 1fr" }}>
                <div className="flex items-center gap-2 row-span-2 self-center pr-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sector.color }} />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {sector.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${govtPct}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-blue-600 font-medium w-16 text-right shrink-0">{fmt(sector.govtOutlayCrore)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${obPct}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-emerald-700 font-medium w-16 text-right shrink-0">{fmt(sector.orderBookCrore)}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

    </main>
  )
}
