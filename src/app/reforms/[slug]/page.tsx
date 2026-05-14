import { notFound } from "next/navigation"
import Link from "next/link"
import { REFORMS, SECTORS, COMPANIES } from "@/lib/seed-data"

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

const STATUS_STYLES = {
  PROPOSED:    { badge: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-400",   line: "border-amber-200"   },
  NOTIFIED:    { badge: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-400",     line: "border-sky-200"     },
  IMPLEMENTED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", line: "border-emerald-200" },
  OPERATIONAL: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", line: "border-emerald-200" },
  STALLED:     { badge: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-400",    line: "border-rose-200"    },
  REVERSED:    { badge: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500",     line: "border-red-200"     },
} as const

// The reform journey stages — which ones are "reached" depends on status
const STAGES = [
  { key: "PROPOSED",    label: "Proposed"    },
  { key: "NOTIFIED",    label: "Notified"    },
  { key: "IMPLEMENTED", label: "Implemented" },
  { key: "OPERATIONAL", label: "Operational" },
] as const

const STAGE_ORDER = ["PROPOSED", "NOTIFIED", "IMPLEMENTED", "OPERATIONAL"]

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const reform = REFORMS.find((r) => r.slug === slug)
  return { title: reform?.title ?? "Reform Not Found" }
}

export default async function ReformDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const reform = REFORMS.find((r) => r.slug === slug)
  if (!reform) notFound()

  const styles     = STATUS_STYLES[reform.status]
  const sectorData = SECTORS.find((s) => s.name === reform.sector.name)
  const currentStageIndex = STAGE_ORDER.indexOf(reform.status)

  // Companies in the same sector — potential beneficiaries
  const beneficiaries = COMPANIES.filter((co) =>
    co.sectors.some((s) => s === reform.sector.name)
  )

  // Other reforms in same sector
  const related = REFORMS.filter((r) => r.id !== reform.id && r.sector.name === reform.sector.name)

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/reforms" className="hover:text-foreground transition-colors">Reforms</Link>
        <span>›</span>
        <span className="font-medium" style={{ color: sectorData?.color }}>{reform.sector.name}</span>
        <span>›</span>
        <span className="text-foreground line-clamp-1 max-w-xs">{reform.title}</span>
      </nav>

      {/* Hero */}
      <div className="relative border rounded-2xl p-8 bg-card overflow-hidden"
        style={{ borderLeftColor: sectorData?.color, borderLeftWidth: "4px" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: sectorData?.color }} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${styles.badge}`}>
              {reform.status.charAt(0) + reform.status.slice(1).toLowerCase()}
            </span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={sectorData ? { color: sectorData.color, borderColor: `${sectorData.color}50`, backgroundColor: `${sectorData.color}0d` } : {}}
            >
              {reform.sector.name}
            </span>
            {reform.scheme && (
              <span className="text-xs text-muted-foreground border rounded px-2.5 py-1">
                {reform.scheme.name}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl tracking-tight leading-snug mb-3">{reform.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{reform.summary}</p>

          {reform.note && (
            <p className="mt-3 text-sm italic text-muted-foreground border-l-2 pl-3"
              style={{ borderColor: sectorData?.color }}>
              {reform.note}
            </p>
          )}
        </div>
      </div>

      {/* Money metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-xl overflow-hidden bg-border border">
        {[
          reform.budgetOutlayCrore    && { label: "Budget Outlay",       value: fmt(reform.budgetOutlayCrore),         sub: "direct govt allocation",    color: "text-violet-600" },
          reform.fdiCommittedCrore    && { label: "FDI Committed",       value: fmt(reform.fdiCommittedCrore),         sub: "post-reform commitments",   color: "text-emerald-600" },
          reform.marketOpportunityCrore && { label: "Market Opportunity", value: fmt(reform.marketOpportunityCrore),   sub: "addressable market size",   color: "text-blue-600" },
        ].filter(Boolean).map((stat) => {
          const s = stat as { label: string; value: string; sub: string; color: string }
          return (
            <div key={s.label} className="bg-card px-6 py-5">
              <p className={`font-display text-3xl tracking-tight ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-foreground mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          )
        })}
      </section>

      {/* Timeline / progress */}
      <section className="border rounded-xl p-6 bg-card">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">Reform Journey</h2>
        <div className="flex items-start gap-0">
          {STAGES.map((stage, i) => {
            const reached  = STAGE_ORDER.indexOf(stage.key) <= currentStageIndex
            const isCurrent = stage.key === reform.status || (stage.key === "IMPLEMENTED" && reform.status === "OPERATIONAL")
            const isLast   = i === STAGES.length - 1
            return (
              <div key={stage.key} className="flex flex-1 flex-col items-center">
                <div className="flex items-center w-full">
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    reached ? `${styles.dot} border-transparent` : "bg-card border-border"
                  }`}>
                    {reached && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 transition-colors ${reached ? styles.dot.replace("bg-", "bg-") : "bg-border"}`}
                      style={reached ? { backgroundColor: sectorData?.color } : {}} />
                  )}
                </div>
                <p className={`text-[10px] font-medium mt-2 text-center ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                  {stage.label}
                </p>
                {stage.key === "NOTIFIED" && reform.notifiedAt && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(reform.notifiedAt)}</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Key details */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="border rounded-xl p-5 bg-card space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Details</h2>
          {[
            { label: "Status",     value: reform.status.charAt(0) + reform.status.slice(1).toLowerCase() },
            { label: "Difficulty", value: reform.difficulty === "HIGH" ? "Complex reform" : reform.difficulty === "MEDIUM" ? "Moderate reform" : "Straightforward" },
            { label: "Sector",     value: reform.sector.name },
            reform.scheme ? { label: "Scheme",   value: reform.scheme.name } : null,
            reform.notifiedAt ? { label: "Notified", value: fmtDate(reform.notifiedAt) } : null,
            reform.sourceUrl  ? { label: "Source",   value: "Official notification ↗" } : null,
          ].filter(Boolean).map((row) => {
            const r = row as { label: string; value: string }
            return (
              <div key={r.label} className="flex items-start justify-between gap-4">
                <span className="text-xs text-muted-foreground shrink-0">{r.label}</span>
                {r.label === "Source" && reform.sourceUrl ? (
                  <a href={reform.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:underline text-right">
                    {r.value}
                  </a>
                ) : (
                  <span className="text-xs font-medium text-right">{r.value}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* Sector context */}
        {sectorData && (
          <div className="border rounded-xl p-5 bg-card space-y-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Sector Context</h2>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sectorData.color }} />
              <span className="font-semibold text-sm" style={{ color: sectorData.color }}>{sectorData.name}</span>
            </div>
            {[
              { label: "Govt outlay",  value: fmt(sectorData.govtOutlayCrore),  color: "text-violet-700" },
              { label: "Order book",   value: fmt(sectorData.orderBookCrore),    color: "text-emerald-700" },
              { label: "Listed cos",   value: `${sectorData.companiesCount}`,    color: "text-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-bold tabular-nums ${color}`}>{value}</span>
              </div>
            ))}
            <div className="pt-1">
              <Link href={`/companies?sectorSlug=${sectorData.slug}`}
                className="text-xs text-blue-600 hover:underline underline-offset-2">
                Browse {sectorData.name} companies →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Beneficiary companies */}
      {beneficiaries.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Potential Beneficiaries
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {beneficiaries.map((co) => {
              const primarySector = SECTORS.find((s) => s.name === co.sectors[0])
              return (
                <Link key={co.id} href={`/companies/${co.slug}`}
                  className="group border rounded-xl p-4 bg-card hover:shadow-sm transition-all"
                  style={{ borderLeftColor: primarySector?.color, borderLeftWidth: "3px" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors">{co.name}</p>
                      <p className="text-xs text-muted-foreground">{co.tickerNse} · NSE</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border tabular-nums ${
                      co.revenueGrowthPct > 15 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-sky-700 bg-sky-50 border-sky-200"
                    }`}>
                      +{co.revenueGrowthPct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="bg-muted/50 rounded-lg py-1.5">
                      <p className="text-xs font-bold tabular-nums">{fmt(co.orderBookCrore)}</p>
                      <p className="text-[10px] text-muted-foreground">Order Book</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-1.5">
                      <p className={`text-xs font-bold tabular-nums ${co.roce > 20 ? "text-emerald-700" : ""}`}>{co.roce}%</p>
                      <p className="text-[10px] text-muted-foreground">ROCE</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Related reforms */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Related Reforms
          </h2>
          <div className="divide-y border rounded-xl overflow-hidden bg-card">
            {related.map((r) => {
              const s = STATUS_STYLES[r.status]
              return (
                <Link key={r.id} href={`/reforms/${r.slug}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors group">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                  <p className="text-sm flex-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{r.title}</p>
                  {r.budgetOutlayCrore && (
                    <span className="text-xs font-bold tabular-nums text-violet-700 shrink-0">{fmt(r.budgetOutlayCrore)}</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border shrink-0 ${s.badge}`}>
                    {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

    </main>
  )
}
