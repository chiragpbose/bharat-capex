"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { href: "/reforms", label: "Reforms" },
  { href: "/tenders", label: "Tenders" },
  { href: "/companies", label: "Companies" },
  { href: "/schemes", label: "Schemes" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-2 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-white rounded-full shadow-lg border border-gray-100 px-5 h-14 flex items-center justify-between pointer-events-auto">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-display font-bold text-lg tracking-tight">
            Bharat<span className="text-orange-500">Capex</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                pathname.startsWith(href)
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
