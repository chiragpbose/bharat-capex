import { notFound } from "next/navigation"
import Link from "next/link"
import { SCHEMES, SECTORS, COMPANIES, REFORMS } from "@/lib/seed-data"

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtJobs(n: number) {
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000)   return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const scheme = SCHEMES.find((s) => s.slug === slug)
  return { title: scheme?.name ?? "Scheme Not Found" }
}

export default async function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const scheme = SCHEMES.find((s) => s.slug === slug)
  if (!scheme) notFound()

  const disbursedPct = Math.round((scheme.disbursedCrore / scheme.budgetOutlayCrore) * 100)
  const multiplier   = (scheme.totalInvestmentCrore / scheme.budgetOutlayCrore).toFixed(1)

  const beneficiaryCompanies = COMPANIES.filter((co) =>
    scheme.beneficiaryTickers.includes(co.tickerNse)
  )

  const linkedReforms = REFORMS.filter((r) =>
    scheme.linkedReformSlugs.includes(r.slug)
  )

  const relatedSchemes = SCHEMES.filter((s) =>
    s.id !== scheme.id &&
    s.sectorNames.some((name) => scheme.sectorNames.includes(name))
  )

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/schemes" className="hover:text-foreground transition-colors">Schemes</Link>
        <span>›</span>
        <span className="text-foreground">{scheme.shortName}</span>
      </nav>

      {/* Hero */}
      <div className="relative border rounded-2xl overflow-hidden bg-card">
        <div className="h-1.5 w-full" style={{ backgroundColor: scheme.color }} />
        <div className="p-8">
          <div className="absolute top-8 right-8 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ backgroundColor: scheme.color }} />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200">
                Active
              </span>
              <span className="text-xs text-muted-foreground border rounded px-2.5 py-1 font-medium">
                {scheme.ministry}
              </span>
              <span className="text-xs text-muted-foreground border rounded px-2.5 py-1">
                {scheme.schemeStartYear}–{scheme.schemeEndYear}
              </span>
              {scheme.sectorNames.map((name) => {
                const sec = SECTORS.find((s) => s.name === name)
                return (
                  <span key={name} className="text-xs font-medium px-2.5 py-1 rounded-full border"
                    style={sec ? { color: sec.color, borderColor: `${sec.color}50`, backgroundColor: `${sec.color}0d` } : {}}>
                    {name}
                  </span>
                )
              })}
            </div>
            <h1 className="font-display text-3xl tracking-tight mb-3">{scheme.name}</h1>
            <p className="text-muted-foreground leading-relaxed">{scheme.description}</p>
            {scheme.highlight && (
              <p className="mt-3 text-sm font-medium border-l-2 pl-3 italic text-muted-foreground"
                style={{ borderColor: scheme.color }}>
                {scheme.highlight}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl overflow-hidden bg-border border">
        {[
          { label: "Budget Outlay",     value: fmt(scheme.budgetOutlayCrore),    sub: "govt commitment",        color: "text-violet-600" },
          { label: "Disbursed",         value: fmt(scheme.disbursedCrore),       sub: `${disbursedPct}% released`,  color: "text-blue-600"   },
          { label: "Investment In",     value: fmt(scheme.totalInvestmentCrore), sub: `${multiplier}× multiplier`,  color: "text-emerald-600"},
          { label: "Jobs Targeted",     value: scheme.jobsTargeted ? fmtJobs(scheme.jobsTargeted) : "—", sub: "direct employment", color: "text-sky-600" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card px-5 py-4">
            <p className={`font-display text-2xl tracking-tight ${color}`}>{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </section>

      {/* Disbursement progress */}
      <section className="border rounded-xl p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Disbursement Progress</h2>
          <span className="text-xs font-bold tabular-nums" style={{ color: scheme.color }}>{disbursedPct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all" style={{ width: `${disbursedPct}%`, backgroundColor: scheme.color }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{fmt(scheme.disbursedCrore)} disbursed</span>
          <span>{fmt(scheme.budgetOutlayCrore - scheme.disbursedCrore)} remaining</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Approved Projects</p>
            <p className="text-lg font-bold tabular-nums">{scheme.approvedProjects.toLocaleString("en-IN")}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Scheme Period</p>
            <p className="text-lg font-bold tabular-nums">{scheme.schemeStartYear} – {scheme.schemeEndYear}</p>
          </div>
        </div>
      </section>

      {/* All beneficiaries */}
      <section>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
          Key Beneficiaries
        </h2>

        {/* Listed companies we track */}
        {beneficiaryCompanies.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Listed on NSE</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {beneficiaryCompanies.map((co) => {
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
                      }`}>+{co.revenueGrowthPct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-muted/50 rounded-lg py-1.5">
                        <p className="text-xs font-bold tabular-nums">{fmt(co.revenueCrore)}</p>
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                      </div>
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
          </div>
        )}

        {/* Non-listed / unlisted key players */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">All Key Players</p>
          <div className="flex flex-wrap gap-2">
            {scheme.keyBeneficiaries.map((name) => (
              <span key={name} className="text-xs px-3 py-1.5 rounded-full border bg-card font-medium text-foreground">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Linked reforms */}
      {linkedReforms.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Linked Reforms</h2>
          <div className="divide-y border rounded-xl overflow-hidden bg-card">
            {linkedReforms.map((reform) => {
              const statusColors = {
                IMPLEMENTED: "text-emerald-700 bg-emerald-50 border-emerald-200",
                OPERATIONAL: "text-emerald-700 bg-emerald-50 border-emerald-200",
                NOTIFIED:    "text-sky-700 bg-sky-50 border-sky-200",
                PROPOSED:    "text-amber-700 bg-amber-50 border-amber-200",
                STALLED:     "text-rose-700 bg-rose-50 border-rose-200",
                REVERSED:    "text-red-700 bg-red-50 border-red-200",
              }
              return (
                <Link key={reform.id} href={`/reforms/${reform.slug}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/20 transition-colors group">
                  <p className="text-sm flex-1 group-hover:text-blue-600 transition-colors">{reform.title}</p>
                  {reform.budgetOutlayCrore && (
                    <span className="text-xs font-bold tabular-nums text-violet-700 shrink-0">{fmt(reform.budgetOutlayCrore)}</span>
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${statusColors[reform.status]}`}>
                    {reform.status.charAt(0) + reform.status.slice(1).toLowerCase()}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Related schemes */}
      {relatedSchemes.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Related Schemes</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedSchemes.map((s) => (
              <Link key={s.id} href={`/schemes/${s.slug}`}
                className="group flex items-center gap-3 border rounded-xl p-4 bg-card hover:shadow-sm transition-all">
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold group-hover:text-blue-600 transition-colors line-clamp-1">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.ministry}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums text-violet-700">{fmt(s.budgetOutlayCrore)}</p>
                  <p className="text-[10px] text-muted-foreground">outlay</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </main>
  )
}
