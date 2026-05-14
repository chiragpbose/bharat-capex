"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const STATUS_OPTIONS = [
  { value: "PROPOSED",    label: "Proposed",    dot: "#f59e0b" },
  { value: "NOTIFIED",    label: "Notified",    dot: "#38bdf8" },
  { value: "IMPLEMENTED", label: "Implemented", dot: "#10b981" },
  { value: "OPERATIONAL", label: "Operational", dot: "#10b981" },
  { value: "STALLED",     label: "Stalled",     dot: "#fb7185" },
]

type DropdownOption = { value: string; label: string; dot?: string; count?: number }

function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = options.find((o) => o.value === value)
  const isActive = !!selected

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all ${
          isActive
            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
            : "bg-card text-foreground border-border hover:border-foreground/40 hover:bg-muted/50"
        }`}
      >
        {isActive && selected?.dot && (
          <span className="w-2 h-2 rounded-full bg-white/80 shrink-0" />
        )}
        <span>{isActive ? selected?.label : label}</span>
        {isActive ? (
          <span
            role="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(""); setOpen(false) }}
            className="ml-0.5 w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white leading-none transition-colors text-base"
          >
            ×
          </span>
        ) : (
          <svg
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-card border rounded-xl shadow-xl min-w-50 py-1.5 overflow-hidden">
          {/* Any / clear option */}
          <button
            onClick={() => { onChange(""); setOpen(false) }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted/60 ${!value ? "font-medium" : "text-muted-foreground"}`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              !value ? "border-blue-600 bg-blue-600" : "border-border"
            }`}>
              {!value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            Any
          </button>

          <div className="h-px bg-border mx-3 my-1" />

          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-muted/60 ${isSelected ? "font-medium" : "text-muted-foreground"}`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-blue-600 bg-blue-600" : "border-border"
                }`}>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                {opt.dot && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />
                )}
                <span className="flex-1 text-foreground">{opt.label}</span>
                {opt.count !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums">{opt.count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

type Props = {
  sectors: string[]
  statusCounts: Record<string, number>
  filteredCount: number
}

export function ReformFilters({ sectors, statusCounts, filteredCount }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get("status") ?? ""
  const sector = searchParams.get("sector") ?? ""

  function update(key: "status" | "sector", val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set(key, val)
    else params.delete(key)
    router.push(`/reforms?${params}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Dropdown
        label="Status"
        value={status}
        onChange={(v) => update("status", v)}
        options={STATUS_OPTIONS.map((o) => ({ ...o, count: statusCounts[o.value] ?? 0 }))}
      />
      <Dropdown
        label="Sector"
        value={sector}
        onChange={(v) => update("sector", v)}
        options={sectors.map((name) => ({ value: name, label: name }))}
      />
      {(status || sector) && (
        <button
          onClick={() => router.push("/reforms")}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 px-1"
        >
          Clear all
        </button>
      )}
      <span className="text-xs text-muted-foreground ml-1">
        {filteredCount} {filteredCount === 1 ? "reform" : "reforms"}
      </span>
    </div>
  )
}
