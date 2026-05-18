import Link from "next/link"
import type { Metadata } from "next"
import { getSignals, getSignalStats, type SignalType } from "@/lib/data/signals"

export const metadata: Metadata = { title: "Signals" }

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
}

const SOURCE_LABEL: Record<string, string> = {
  NSE:        "NSE",
  PIB:        "PIB",
  NEWS_ET:    "Economic Times",
  NEWS_BS:    "Business Standard",
  NEWS_MINT:  "Mint",
  NITI:       "NITI Aayog",
  CPPP:       "CPPP",
}

const TYPE_CONFIG: Record<SignalType, { label: string; color: string; bg: string; border: string }> = {
  ORDER_WIN:           { label: "Order Win",           color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200" },
  CAPEX_PLAN:          { label: "Capex Plan",          color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200"    },
  CAPACITY_EXPANSION:  { label: "Capacity Expansion",  color: "text-sky-700",     bg: "bg-sky-50",      border: "border-sky-200"     },
  MANAGEMENT_PROMISE:  { label: "Mgmt Guidance",       color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200"   },
  POLICY_UPDATE:       { label: "Policy Update",       color: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200"  },
  OTHER:               { label: "Other",               color: "text-gray-600",    bg: "bg-gray-50",     border: "border-gray-200"    },
}

const ALL_TYPES = Object.keys(TYPE_CONFIG) as SignalType[]

const SOURCE_ORDER = ["NSE", "PIB", "NEWS_ET", "NEWS_BS", "NEWS_MINT", "NITI", "CPPP"]

type SearchParams = Promise<{ type?: string; source?: string; page?: string }>

export default async function SignalsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type, source, page } = await searchParams
  const pageNum  = Math.max(1, parseInt(page ?? "1", 10))
  const pageSize = 50
  const offset   = (pageNum - 1) * pageSize

  const validType   = type   && ALL_TYPES.includes(type as SignalType)   ? type   : undefined
  const validSource = source && SOURCE_ORDER.includes(source)             ? source : undefined

  const [signals, stats] = await Promise.all([
    getSignals({ type: validType, source: validSource, limit: pageSize, offset }),
    getSignalStats(),
  ])

  const totalValue = signals.reduce((s, sig) => s + (sig.valueCrore ?? 0), 0)

  function filterHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (params.type)   p.set("type",   params.type)
    if (params.source) p.set("source", params.source)
    const q = p.toString()
    return `/signals${q ? `?${q}` : ""}`
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium tracking-widest text-blue-600 uppercase mb-2">Live Intelligence Feed</p>
        <h1 className="font-display text-4xl tracking-tight mb-1">Signals</h1>
        <p className="text-muted-foreground text-sm">
          Extracted order wins, capex plans, and policy moves from NSE filings, PIB, and financial news
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-px rounded-xl overflow-hidden bg-border border">
        {[
          { label: "Total signals",  value: stats.total.toLocaleString("en-IN"),                     color: "text-blue-600"    },
          { label: "Order wins",     value: (stats.byType["ORDER_WIN"] ?? 0).toLocaleString("en-IN"), color: "text-emerald-600" },
          { label: "Capex plans",    value: (stats.byType["CAPEX_PLAN"] ?? 0).toLocaleString("en-IN"),color: "text-blue-600"    },
          { label: "Value (page)",   value: totalValue > 0 ? fmt(totalValue) : "—",                   color: "text-violet-600"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card px-5 py-4">
            <p className={`font-display text-2xl tracking-tight ${color}`}>{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Link
            href={filterHref({ source: validSource })}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              !validType
                ? "bg-blue-600 text-white border-blue-600"
                : "text-muted-foreground border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            All types
          </Link>
          {ALL_TYPES.map((t) => {
            const cfg   = TYPE_CONFIG[t]
            const count = stats.byType[t] ?? 0
            const active = validType === t
            return (
              <Link
                key={t}
                href={filterHref({ type: t, source: validSource })}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  active
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : "text-muted-foreground border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {cfg.label}
                <span className="ml-1.5 opacity-60">{count.toLocaleString("en-IN")}</span>
              </Link>
            )
          })}
        </div>

        {/* Source filter */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href={filterHref({ type: validType })}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              !validSource
                ? "bg-gray-900 text-white border-gray-900"
                : "text-muted-foreground border hover:text-foreground hover:border-foreground/30"
            }`}
          >
            All sources
          </Link>
          {SOURCE_ORDER.filter((s) => stats.bySource[s]).map((s) => (
            <Link
              key={s}
              href={filterHref({ type: validType, source: s })}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                validSource === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "text-muted-foreground border hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {SOURCE_LABEL[s] ?? s}
              <span className="ml-1.5 opacity-60">{(stats.bySource[s] ?? 0).toLocaleString("en-IN")}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Feed */}
      {signals.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">No signals match these filters.</div>
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden">
          {signals.map((sig) => {
            const cfg = TYPE_CONFIG[sig.type] ?? TYPE_CONFIG.OTHER
            return (
              <div key={sig.id} className="bg-card px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Badges + date */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                        {SOURCE_LABEL[sig.source] ?? sig.source}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtDate(sig.publishedAt)}</span>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-foreground leading-relaxed">{sig.summary}</p>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {sig.valueCrore !== null && (
                        <span className="font-display font-semibold text-emerald-700">{fmt(sig.valueCrore)}</span>
                      )}
                      {sig.awardingBody && (
                        <span>Awarded by <span className="text-foreground font-medium">{sig.awardingBody}</span></span>
                      )}
                    </div>
                  </div>

                  {/* Link out */}
                  {sig.attachmentUrl && (
                    <a
                      href={sig.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-blue-600 hover:underline mt-1"
                    >
                      Source ↗
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Showing {offset + 1}–{offset + signals.length} of filtered results
        </p>
        <div className="flex gap-2">
          {pageNum > 1 && (
            <Link
              href={`${filterHref({ type: validType, source: validSource })}&page=${pageNum - 1}`}
              className="text-xs px-3 py-1.5 rounded-full border font-medium hover:bg-gray-50"
            >
              ← Prev
            </Link>
          )}
          {signals.length === pageSize && (
            <Link
              href={`${filterHref({ type: validType, source: validSource })}&page=${pageNum + 1}`}
              className="text-xs px-3 py-1.5 rounded-full border font-medium hover:bg-gray-50"
            >
              Next →
            </Link>
          )}
        </div>
      </div>

    </main>
  )
}
