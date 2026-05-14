import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type Reform = {
  id: string
  title: string
  slug: string
  summary: string
  status: "PROPOSED" | "NOTIFIED" | "IMPLEMENTED" | "STALLED" | "REVERSED"
  difficulty: "LOW" | "MEDIUM" | "HIGH"
  notifiedAt: Date | null
  sourceUrl: string | null
  sector: { name: string; color: string | null }
  scheme: { name: string; slug: string } | null
}

const STATUS_STYLES: Record<Reform["status"], string> = {
  PROPOSED:    "bg-yellow-100 text-yellow-800 border-yellow-200",
  NOTIFIED:    "bg-blue-100 text-blue-800 border-blue-200",
  IMPLEMENTED: "bg-green-100 text-green-800 border-green-200",
  STALLED:     "bg-orange-100 text-orange-800 border-orange-200",
  REVERSED:    "bg-red-100 text-red-800 border-red-200",
}

const DIFFICULTY_STYLES: Record<Reform["difficulty"], string> = {
  LOW:    "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH:   "bg-red-100 text-red-700",
}

const STATUS_LABELS: Record<Reform["status"], string> = {
  PROPOSED:    "Proposed",
  NOTIFIED:    "Notified",
  IMPLEMENTED: "Implemented",
  STALLED:     "Stalled",
  REVERSED:    "Reversed",
}

export function ReformCard({ reform }: { reform: Reform }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/reforms/${reform.slug}`}
            className="text-base font-semibold leading-snug hover:underline line-clamp-2"
          >
            {reform.title}
          </Link>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs font-medium ${STATUS_STYLES[reform.status]}`}
          >
            {STATUS_LABELS[reform.status]}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
            style={
              reform.sector.color
                ? { backgroundColor: `${reform.sector.color}20`, borderColor: reform.sector.color, color: reform.sector.color }
                : { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1", color: "#475569" }
            }
          >
            {reform.sector.name}
          </span>

          <Badge
            variant="secondary"
            className={`text-xs ${DIFFICULTY_STYLES[reform.difficulty]}`}
          >
            {reform.difficulty.charAt(0) + reform.difficulty.slice(1).toLowerCase()} difficulty
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{reform.summary}</p>

        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {reform.scheme && (
              <span>
                Scheme:{" "}
                <Link href={`/schemes/${reform.scheme.slug}`} className="underline hover:text-foreground">
                  {reform.scheme.name}
                </Link>
              </span>
            )}
            {reform.notifiedAt && (
              <span>
                Notified {new Date(reform.notifiedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          {reform.sourceUrl && (
            <a
              href={reform.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Source ↗
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
