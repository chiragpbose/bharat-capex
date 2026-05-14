import Link from "next/link"
import { SCHEMES, SECTORS } from "@/lib/seed-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Schemes",
  description: "Government incentive schemes driving India's industrial capex cycle.",
}

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

type SearchParams = Promise<{ sector?: string }>

export default async function SchemesPage({ searchParams }: { searchParams: SearchParams }) {
  const { sector } = await searchParams

  const filtered = sector
    ? SCHEMES.filter((s) => s.sectorNames.includes(sector))
    : SCHEMES

  const totalOutlay      = SCHEMES.reduce((s, sc) => s + sc.budgetOutlayCrore, 0)
  const totalDisbursed   = SCHEMES.reduce((s, sc) => s + sc.disbursedCrore, 0)
  const totalInvestment  = SCHEMES.reduce((s, sc) => s + sc.totalInvestmentCrore, 0)
  const totalJobs        = SCHEMES.reduce((s, sc) => s + (sc.jobsTargeted ?? 0), 0)

  const uniqueSectors = Array.from(new Set(SCHEMES.flatMap((s) => s.sectorNames)))

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b">
        <div>
          <p className="text-xs font-medium tracking-widest text-blue-600 uppercase mb-2">Incentive Programs</p>
          <h1 className="font-display text-4xl tracking-tight">Government Schemes</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-lg">
            PLI schemes, mission programs, and infrastructure initiatives that route government money into listed companies.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          {[
            { value: fmt(totalOutlay),     label: "total outlay",    color: "text-violet-600" },
            { value: fmt(totalInvestment), label: "investment attracted", color: "text-blue-600" },
            { value: fmtJobs(totalJobs),   label: "jobs targeted",   color: "text-emerald-600" },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-right">
              <p className={`font-display text-xl tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disbursement progress banner */}
      <div className="border rounded-xl p-5 bg-card space-y-2">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-foreground">Overall disbursement progress</span>
          <span className="tabular-nums text-muted-foreground">
            {fmt(totalDisbursed)} of {fmt(totalOutlay)} disbursed
          </span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${Math.round((totalDisbursed / totalOutlay) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {Math.round((totalDisbursed / totalOutlay) * 100)}% disbursed across {SCHEMES.length} active schemes
        </p>
      </div>

      {/* Sector filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/schemes"
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
            !sector
              ? "bg-blue-600 text-white border-blue-600"
              : "text-muted-foreground border hover:text-foreground hover:border-foreground/40"
          }`}
        >
          All sectors
        </Link>
        {uniqueSectors.map((name) => {
          const sec = SECTORS.find((s) => s.name === name)
          const isActive = sector === name
          return (
            <Link
              key={name}
              href={`/schemes?sector=${encodeURIComponent(name)}`}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                isActive ? "" : "text-muted-foreground border hover:text-foreground hover:border-foreground/40"
              }`}
              style={isActive && sec ? { color: sec.color, borderColor: `${sec.color}60`, backgroundColor: `${sec.color}12` } : {}}
            >
              {name}
            </Link>
          )
        })}
      </div>

      {/* Scheme cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((scheme) => {
          const disbursedPct = Math.round((scheme.disbursedCrore / scheme.budgetOutlayCrore) * 100)
          const multiplier   = (scheme.totalInvestmentCrore / scheme.budgetOutlayCrore).toFixed(1)

          return (
            <Link
              key={scheme.id}
              href={`/schemes/${scheme.slug}`}
              className="group block border rounded-xl bg-card hover:shadow-md transition-all overflow-hidden"
            >
              {/* Colour top bar */}
              <div className="h-1 w-full" style={{ backgroundColor: scheme.color }} />

              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm group-hover:text-blue-600 transition-colors leading-snug">
                      {scheme.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{scheme.ministry}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 shrink-0">
                    Active
                  </span>
                </div>

                {/* Budget + investment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Budget outlay</p>
                    <p className="font-display text-xl tabular-nums text-violet-700">{fmt(scheme.budgetOutlayCrore)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Investment attracted</p>
                    <p className="font-display text-xl tabular-nums text-blue-700">{fmt(scheme.totalInvestmentCrore)}</p>
                    <p className="text-[10px] text-muted-foreground">{multiplier}× multiplier</p>
                  </div>
                </div>

                {/* Disbursement progress */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Disbursed</span>
                    <span className="tabular-nums font-medium text-foreground">{fmt(scheme.disbursedCrore)} <span className="text-muted-foreground font-normal">({disbursedPct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${disbursedPct}%`, backgroundColor: scheme.color }}
                    />
                  </div>
                </div>

                {/* Footer: sectors + jobs + companies */}
                <div className="flex items-end justify-between gap-3 pt-1">
                  <div className="flex flex-wrap gap-1">
                    {scheme.sectorNames.map((name) => {
                      const sec = SECTORS.find((s) => s.name === name)
                      return (
                        <span
                          key={name}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                          style={sec ? { color: sec.color, borderColor: `${sec.color}50`, backgroundColor: `${sec.color}0d` } : {}}
                        >
                          {name}
                        </span>
                      )
                    })}
                  </div>
                  {scheme.jobsTargeted && (
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold tabular-nums text-emerald-700">{fmtJobs(scheme.jobsTargeted)}</p>
                      <p className="text-[10px] text-muted-foreground">jobs targeted</p>
                    </div>
                  )}
                </div>

                {/* Key beneficiaries */}
                <div className="pt-1 border-t">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Key beneficiaries</p>
                  <p className="text-xs text-foreground line-clamp-1">{scheme.keyBeneficiaries.join(" · ")}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

    </main>
  )
}
