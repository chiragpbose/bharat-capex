import Link from "next/link"
import { Suspense } from "react"
import { getReforms } from "@/lib/data/reforms"
import { getAllSectors } from "@/lib/data/sectors"
import { ReformFilters } from "@/components/reforms/reform-filters"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reforms Tracker",
  description: "Every policy and regulatory reform shaping India's industrial buildout.",
}

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
}

const STATUS_CONFIG = {
  PROPOSED:    { label: "Proposed",    color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   bar: "bg-amber-400"   },
  NOTIFIED:    { label: "Notified",    color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     bar: "bg-sky-400"     },
  IMPLEMENTED: { label: "Implemented", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
  OPERATIONAL: { label: "Operational", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
  STALLED:     { label: "Stalled",     color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    bar: "bg-rose-400"    },
} as const

const ALL_STATUSES = ["PROPOSED", "NOTIFIED", "IMPLEMENTED", "OPERATIONAL", "STALLED"] as const

type SearchParams = Promise<{ status?: string; sector?: string }>

export default async function ReformsPage({ searchParams }: { searchParams: SearchParams }) {
  const { status, sector } = await searchParams

  const [reforms, sectors] = await Promise.all([
    getReforms(status, sector),
    getAllSectors(),
  ])

  const allReforms = await getReforms()

  const totalOutlay = allReforms.reduce((s, r) => s + (r.budgetOutlayCrore    ?? 0), 0)
  const totalFdi    = allReforms.reduce((s, r) => s + (r.fdiCommittedCrore    ?? 0), 0)
  const totalOppty  = allReforms.reduce((s, r) => s + (r.marketOpportunityCrore ?? 0), 0)

  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((s) => [s, allReforms.filter((r) => r.status === s).length])
  )

  const uniqueSectors = Array.from(new Set(allReforms.map((r) => r.sector.name)))

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b">
        <div>
          <p className="text-xs font-medium tracking-widest text-blue-600 uppercase mb-2">Policy Intelligence</p>
          <h1 className="font-display text-4xl tracking-tight">Reforms Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-lg">
            From gazette notification to ground implementation — every reform shaping India&apos;s industrial buildout.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          {[
            { value: fmt(totalOutlay), label: "outlay",  color: "text-violet-600" },
            { value: fmt(totalFdi),    label: "FDI",     color: "text-emerald-600" },
            { value: fmt(totalOppty),  label: "market",  color: "text-blue-600" },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-right">
              <p className={`font-display text-xl tabular-nums ${color}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Suspense>
        <ReformFilters
          sectors={uniqueSectors}
          statusCounts={statusCounts}
          filteredCount={reforms.length}
        />
      </Suspense>

      {/* Reform cards */}
      {reforms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border rounded-xl bg-card">
          No reforms match these filters.
        </div>
      ) : (
        <div className="space-y-3">
          {reforms.map((reform) => {
            const cfg = STATUS_CONFIG[reform.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PROPOSED
            return (
              <Link
                key={reform.id}
                href={`/reforms/${reform.slug}`}
                className="group block border rounded-xl bg-card hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex">
                  <div className={`w-1 shrink-0 ${cfg.bar}`} />
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug group-hover:text-blue-600 transition-colors mb-1">
                          {reform.title}
                        </p>
                        {reform.note && (
                          <p className="text-xs text-muted-foreground italic line-clamp-1">{reform.note}</p>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {reform.budgetOutlayCrore && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Outlay</span>
                          <span className="text-sm font-bold tabular-nums text-violet-700">{fmt(reform.budgetOutlayCrore)}</span>
                        </div>
                      )}
                      {reform.budgetOutlayCrore && (reform.fdiCommittedCrore || reform.marketOpportunityCrore) && (
                        <span className="w-px h-8 bg-border" />
                      )}
                      {reform.fdiCommittedCrore && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">FDI committed</span>
                          <span className="text-sm font-bold tabular-nums text-emerald-700">{fmt(reform.fdiCommittedCrore)}</span>
                        </div>
                      )}
                      {reform.fdiCommittedCrore && reform.marketOpportunityCrore && (
                        <span className="w-px h-8 bg-border" />
                      )}
                      {reform.marketOpportunityCrore && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Market opp.</span>
                          <span className="text-sm font-bold tabular-nums text-blue-700">{fmt(reform.marketOpportunityCrore)}</span>
                        </div>
                      )}

                      <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                        {reform.notifiedAt && (
                          <span className="text-[10px] text-muted-foreground tabular-nums">{fmtDate(reform.notifiedAt)}</span>
                        )}
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full border"
                          style={{ color: reform.sector.color ?? undefined, borderColor: `${reform.sector.color}50`, backgroundColor: `${reform.sector.color}0d` }}
                        >
                          {reform.sector.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </main>
  )
}
