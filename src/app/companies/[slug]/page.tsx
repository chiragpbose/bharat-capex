import { notFound } from "next/navigation"
import Link from "next/link"
import { COMPANIES, SECTORS, TENDERS, REFORMS } from "@/lib/seed-data"

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const co = COMPANIES.find((c) => c.slug === slug)
  return { title: co ? `${co.name} (${co.tickerNse})` : "Company Not Found" }
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const co = COMPANIES.find((c) => c.slug === slug)
  if (!co) notFound()

  const primarySector = SECTORS.find((x) => x.name === co.sectors[0])
  const relatedTenders = TENDERS.filter((t) => t.company.slug === co.slug)
  const relatedReforms = REFORMS.filter((r) =>
    co.sectors.some((s) => s === r.sector.name)
  )

  const totalTenderValue = relatedTenders.reduce((sum, t) => sum + t.valueCrore, 0)

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/companies" className="hover:text-foreground transition-colors">Companies</Link>
        <span>›</span>
        <span className="text-foreground">{co.tickerNse}</span>
      </nav>

      {/* Hero */}
      <div className="relative border rounded-2xl p-8 bg-card overflow-hidden"
        style={{ borderLeftColor: primarySector?.color, borderLeftWidth: "4px" }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: primarySector?.color }} />

        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={primarySector ? { color: primarySector.color, borderColor: `${primarySector.color}50`, backgroundColor: `${primarySector.color}0d` } : {}}
              >
                {co.sectors[0]}
              </span>
              <span className="text-xs text-muted-foreground font-medium">NSE: {co.tickerNse}</span>
            </div>
            <h1 className="font-display text-4xl tracking-tight mb-2">{co.name}</h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">{co.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="font-display text-2xl tracking-tight">{fmt(co.marketCapCrore)}</p>
              <p className="text-xs text-muted-foreground">Market Cap</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg border tabular-nums ${
              co.revenueGrowthPct > 15
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-sky-700 bg-sky-50 border-sky-200"
            }`}>
              +{co.revenueGrowthPct}% revenue growth
            </span>
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden bg-border border">
        {[
          { label: "Revenue",       value: fmt(co.revenueCrore),      sub: "FY25 (est.)",          color: "text-blue-600" },
          { label: "Order Book",    value: fmt(co.orderBookCrore),    sub: "executable backlog",    color: "text-violet-600" },
          { label: "PAT",           value: fmt(co.patCrore),          sub: "net profit",            color: "text-emerald-600" },
          { label: "ROCE",          value: `${co.roce}%`,             sub: "return on cap. employed", color: co.roce > 20 ? "text-emerald-600" : "text-sky-600" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card px-5 py-4">
            <p className={`font-display text-2xl tracking-tight ${color}`}>{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </section>

      {/* Secondary metrics + capex */}
      <section className="grid sm:grid-cols-3 gap-4">

        <div className="border rounded-xl p-5 bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Balance Sheet</p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Debt / Equity</span>
              <span className={`text-sm font-bold tabular-nums ${
                co.debtEquityRatio < 0.5 ? "text-emerald-700"
                : co.debtEquityRatio > 1.5 ? "text-rose-700"
                : "text-foreground"
              }`}>{co.debtEquityRatio}x</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Market Cap</span>
              <span className="text-sm font-bold tabular-nums">{fmt(co.marketCapCrore)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Revenue</span>
              <span className="text-sm font-bold tabular-nums">{fmt(co.revenueCrore)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">P/Sales</span>
              <span className="text-sm font-bold tabular-nums">
                {(co.marketCapCrore / co.revenueCrore).toFixed(1)}x
              </span>
            </div>
          </div>
        </div>

        <div className="border rounded-xl p-5 bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Growth</p>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Revenue growth</span>
              <span className={`text-sm font-bold tabular-nums ${co.revenueGrowthPct > 15 ? "text-emerald-700" : "text-sky-700"}`}>
                +{co.revenueGrowthPct}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Order book</span>
              <span className="text-sm font-bold tabular-nums">{fmt(co.orderBookCrore)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Tenders won</span>
              <span className="text-sm font-bold tabular-nums">{relatedTenders.length}</span>
            </div>
            {relatedTenders.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total value</span>
                <span className="text-sm font-bold tabular-nums text-emerald-700">{fmt(totalTenderValue)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-xl p-5 bg-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Capex Plan</p>
          {co.capexPlannedCrore ? (
            <div className="space-y-2.5">
              <div>
                <p className="font-display text-2xl text-violet-700">{fmt(co.capexPlannedCrore)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">planned investment</p>
              </div>
              <div className="h-px bg-border" />
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                {co.recentWin}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">No disclosed capex plan</p>
              <p className="text-xs text-muted-foreground italic leading-relaxed mt-2">
                {co.recentWin}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Tenders won */}
      {relatedTenders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Tenders Won
            </h2>
            <span className="text-xs text-muted-foreground">{fmt(totalTenderValue)} total</span>
          </div>
          <div className="divide-y border rounded-xl overflow-hidden bg-card">
            {relatedTenders.map((tender) => (
              <div key={tender.id} className="px-4 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-snug">{tender.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tender.awardingBody}</p>
                  </div>
                  <span className="text-xs font-bold tabular-nums whitespace-nowrap text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 shrink-0">
                    {fmt(tender.valueCrore)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
                  <span className="font-medium" style={{ color: tender.sector.color }}>{tender.sector.name}</span>
                  {tender.scheme && (
                    <>
                      <span>·</span>
                      <span className="text-blue-600">{tender.scheme}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>Awarded {fmtDate(tender.awardedAt)}</span>
                  <span>·</span>
                  <span>{tender.completionMonths}mo delivery</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Reforms */}
      {relatedReforms.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Relevant Policy Reforms
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedReforms.map((reform) => (
              <Link key={reform.id} href={`/reforms/${reform.slug}`}
                className="border rounded-xl p-4 bg-card hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {reform.title}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                    reform.status === "IMPLEMENTED" || reform.status === "OPERATIONAL"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : reform.status === "NOTIFIED"
                      ? "text-sky-700 bg-sky-50 border-sky-200"
                      : "text-amber-700 bg-amber-50 border-amber-200"
                  }`}>
                    {reform.status.charAt(0) + reform.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {reform.budgetOutlayCrore && (
                    <span className="font-semibold text-violet-700">{fmt(reform.budgetOutlayCrore)} outlay</span>
                  )}
                  {reform.marketOpportunityCrore && (
                    <span>{fmt(reform.marketOpportunityCrore)} market</span>
                  )}
                  {reform.fdiCommittedCrore && (
                    <span className="text-emerald-700">{fmt(reform.fdiCommittedCrore)} FDI</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sector exposure */}
      <section className="border rounded-xl p-5 bg-card">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Sector Exposure</h2>
        <div className="flex flex-wrap gap-2">
          {co.sectors.map((s) => {
            const sector = SECTORS.find((x) => x.name === s)
            return (
              <Link
                key={s}
                href={`/companies?sectorSlug=${sector?.slug}`}
                className="flex flex-col gap-0.5 px-3 py-2 rounded-xl border hover:shadow-sm transition-all"
                style={sector ? { borderColor: `${sector.color}40`, backgroundColor: `${sector.color}0a` } : {}}
              >
                <span className="text-xs font-semibold" style={{ color: sector?.color }}>{s}</span>
                {sector && (
                  <span className="text-[10px] text-muted-foreground">{fmt(sector.govtOutlayCrore)} govt · {fmt(sector.orderBookCrore)} OB</span>
                )}
              </Link>
            )
          })}
        </div>
      </section>

    </main>
  )
}
