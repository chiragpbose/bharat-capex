import Link from "next/link"
import { TENDERS, SECTORS } from "@/lib/seed-data"

function fmt(crore: number) {
  if (crore >= 100_000) return `₹${(crore / 100_000).toFixed(1)}L cr`
  if (crore >= 1_000)   return `₹${(crore / 1_000).toFixed(0)}K cr`
  return `₹${crore} cr`
}

function fmtDate(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export const metadata = { title: "Tenders" }

const SECTOR_COLORS: Record<string, string> = Object.fromEntries(
  SECTORS.map((s) => [s.name, s.color])
)

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ sectorSlug?: string }>
}) {
  const { sectorSlug } = await searchParams

  const activeSector = sectorSlug ? SECTORS.find((s) => s.slug === sectorSlug) : null

  const filtered = TENDERS.filter((t) => {
    if (!activeSector) return true
    const sec = SECTORS.find((s) => s.name === t.sector.name)
    return sec?.slug === sectorSlug
  })

  const totalValue = filtered.reduce((sum, t) => sum + t.valueCrore, 0)

  return (
    <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs font-medium tracking-widest text-blue-600 uppercase mb-2">Contract Awards</p>
        <h1 className="font-display text-4xl tracking-tight mb-1">
          {activeSector ? `${activeSector.name} Tenders` : "All Tenders"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Government contracts awarded to listed Indian companies · {fmt(totalValue)} total value shown
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden bg-border border">
        {[
          { label: "Tenders shown",  value: filtered.length.toString(),  color: "text-blue-600" },
          { label: "Total value",    value: fmt(totalValue),              color: "text-emerald-600" },
          { label: "Avg. delivery",  value: `${Math.round(filtered.reduce((s, t) => s + t.completionMonths, 0) / Math.max(filtered.length, 1))} mo`, color: "text-sky-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card px-5 py-4">
            <p className={`font-display text-2xl tracking-tight ${color}`}>{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Sector filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/tenders"
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
            href={`/tenders?sectorSlug=${sector.slug}`}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              activeSector?.id === sector.id
                ? "text-white border-transparent"
                : "text-muted-foreground border hover:border-foreground/30"
            }`}
            style={activeSector?.id === sector.id
              ? { backgroundColor: sector.color, borderColor: sector.color }
              : {}}
          >
            {sector.name}
          </Link>
        ))}
      </div>

      {/* Tender list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No tenders in this sector yet.</div>
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {filtered.map((tender) => (
            <div key={tender.id} className="px-5 py-5 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug mb-1">{tender.title}</p>
                  <p className="text-xs text-muted-foreground">{tender.awardingBody}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                    {fmt(tender.valueCrore)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{tender.completionMonths}mo delivery</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                <span
                  className="font-semibold"
                  style={{ color: SECTOR_COLORS[tender.sector.name] ?? "#6b7280" }}
                >
                  {tender.sector.name}
                </span>
                <span className="text-muted-foreground">·</span>
                <Link
                  href={`/companies/${tender.company.slug}`}
                  className="font-medium text-foreground hover:text-blue-600 transition-colors"
                >
                  {tender.company.name}
                </Link>
                <span className="text-muted-foreground text-[10px] border border-border rounded px-1.5 py-0.5">
                  {tender.company.tickerNse}
                </span>
                {tender.scheme && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-blue-600 font-medium">{tender.scheme}</span>
                  </>
                )}
                <span className="text-muted-foreground ml-auto">{fmtDate(tender.awardedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  )
}
