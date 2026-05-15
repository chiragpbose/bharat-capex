# BharatCapex — Claude Code Context

> This file is read by Claude Code at the start of every session.
> Keep "Current State" updated. Everything else changes rarely.

---

## What This Project Is

Personal investment research platform tracking India's industrial buildout.
Maps the chain: **Policy Reform → Scheme → Tender → Company → Stock thesis.**

Primary user: Chirag (the builder). No public users yet.
Full product vision: see `VISION.md`

---

## Tech Stack & Critical Gotchas

Read every line of this before writing any code.

### Next.js 16 (App Router)

- `params` and `searchParams` are **Promises** — always `await` them
  ```ts
  // CORRECT
  const { slug } = await params;
  // WRONG — will throw
  const { slug } = params;
  ```
- Server Components are the default — only add `"use client"` when you genuinely need interactivity or browser APIs
- Data fetching happens in Server Components via direct `db.*` calls, not `fetch`

### Prisma 7

- Config lives in `prisma.config.ts` — **not** inside `schema.prisma`
- Generator: `provider = "prisma-client"` (not `"prisma-client-js"`)
- Client output: `../src/generated/prisma`
- **Always import from `@/generated/prisma/client`** — never from `@prisma/client`
  ```ts
  // CORRECT
  import { db } from "@/lib/db";
  import type { Company } from "@/generated/prisma/client";
  // WRONG
  import { PrismaClient } from "@prisma/client";
  ```
- Constructor requires driver adapter:
  ```ts
  import { Pool } from "@neondatabase/serverless"; // or pg
  import { PrismaPg } from "@prisma/adapter-pg";
  new PrismaClient({ adapter: new PrismaPg(pool) });
  ```
- DB client singleton: `src/lib/db.ts`

### Tailwind CSS v4

- No `tailwind.config.js` — config is in CSS via `@theme inline`
- Use canonical class form: `supports-backdrop-filter:bg-white/80` not `supports-[backdrop-filter]:bg-white/80`
- Custom colours and tokens defined in `src/app/globals.css`

### shadcn/ui (base-ui variant)

- Uses `@base-ui/react` — **not** `@radix-ui/react-*`
- Import components from `@/components/ui/*`

### React 19

- Context syntax changed:
  ```tsx
  // CORRECT
  <ThemeContext value={theme}>
  // WRONG
  <ThemeContext.Provider value={theme}>
  ```

### Zod v4

- `z.record()` requires explicit key type: `z.record(z.string(), z.unknown())`
- `.refine()` API has changed — check docs if using complex refinements
- Always infer types from schemas: `type X = z.infer<typeof xSchema>`

### TypeScript

- Strict mode is on
- All shared types live in `src/types/index.ts` — import from there, not from Prisma directly

---

## Project Structure

```
bharat-capex/
├── prisma/
│   ├── schema.prisma          Full DB schema — all models + relations
│   └── prisma.config.ts       Prisma 7 config (required)
│
├── src/
│   ├── app/
│   │   ├── page.tsx           Homepage — feed + sector bars + company movers
│   │   ├── reforms/           Listing + [slug] detail
│   │   ├── tenders/           Listing only (detail page not yet built)
│   │   ├── companies/         Listing + [slug] detail
│   │   └── schemes/           Listing + [slug] detail
│   │
│   ├── components/
│   │   ├── ui/                shadcn/ui components (badge, button, card, select...)
│   │   ├── layout/nav.tsx     Sticky nav
│   │   └── reforms/           reform-card.tsx, reform-filters.tsx
│   │
│   ├── lib/
│   │   ├── db.ts              Prisma singleton — use this everywhere
│   │   ├── seed-data.ts       ⚠️ TEMPORARY — all pages use this, to be replaced
│   │   ├── utils.ts           cn() helper
│   │   ├── validations/       Zod schemas (reform, tender, company, contribution)
│   │   ├── data/              Data access layer (only reforms.ts exists so far)
│   │   └── pipeline/          ← TO BE BUILT (scrapers + AI extraction)
│   │       ├── sources/       BSE filings, PIB RSS, news RSS, CPPP scraper
│   │       └── extract/       Claude API extraction layer
│   │
│   └── generated/prisma/      Auto-generated Prisma client — never edit manually
│
├── CLAUDE.md                  ← You are here
├── VISION.md                  Full product vision and roadmap
└── .env.example               Copy to .env — fill Supabase credentials
```

---

## Current State

> **Update this section at the start or end of every session.**

### What's built

- ✅ All 8 pages complete with full UI (homepage, reforms, tenders, companies, schemes + detail pages)
- ✅ Design system (Space Grotesk + DM Sans, sector colours, status colours)
- ✅ Prisma schema written and validated (all models, all relations)
- ✅ Zod validation schemas (reform, tender, company, contribution)
- ✅ `src/lib/db.ts` — Prisma singleton with pg driver adapter
- ✅ `src/lib/data/reforms.ts` — data access layer started (DB not connected yet)
- ✅ LinkedIn-style client dropdown filters (`src/components/reforms/reform-filters.tsx`)

### What's not built yet

- ❌ Supabase not connected — .env credentials not yet filled in
- ❌ Data pipeline (scrapers, AI extraction) — not started
- ❌ Data access layer (`src/lib/data/*`) — only reforms.ts exists; all pages still use seed-data.ts
- ❌ /promises page (Management Promises tracker)
- ❌ /calendar page (Policy Calendar)
- ❌ /budget page (Budget Tracker)
- ❌ Search
- ❌ src/app/api/ — no API routes exist yet
- ❌ src/hooks/ — no client hooks exist yet
- ❌ src/types/ — no shared types file yet

### Currently working on

→ Connecting Supabase. Next: BSE filings scraper → AI extraction pipeline.

---

## Rules — Never Break These

1. **No manual data entry.** All data flows from the automated pipeline. Never suggest forms for admins to type in tenders or reforms.

2. **Never import from `@prisma/client`.** Always `@/generated/prisma/client`.

3. **No community contribution features.** No public users, no submission forms, no moderation queue. Deferred indefinitely.

4. **No monetisation features.** No subscription walls, payment flows, or premium tiers. Not the current goal.

5. **seed-data.ts is temporary.** Never add more hardcoded data to it. The goal is to replace it with real DB queries, not grow it.

6. **All pages are Server Components by default.** Only reach for `"use client"` when strictly necessary.

---

## Data Pipeline Architecture (to be built)

```
Sources → Scrapers/Fetchers → Raw Storage (Supabase) → AI Extraction (Claude API) → DB
```

### Source priority order

1. BSE bulk announcements — highest ROI, free, structured
2. PIB RSS feed — government announcements
3. News RSS (ET, Business Standard, Mint) — sector news
4. CPPP scraper — tender awards (Playwright, harder)
5. PDF pipeline — annual reports + concall transcripts → ManagementPromise table

### AI extraction model choice

- **Haiku 4.5** for most tasks: BSE announcements, PIB press releases, news articles
- **Sonnet 4.6** only for: annual reports, concall PDFs, complex multi-entity extraction
- Use **Batch API** for all nightly jobs (50% cost saving)
- Use **prompt caching** for system prompts (90% saving on repeated context)
- Target cost: ~$3–10/month total

### Key pipeline files (to create)

```
src/lib/pipeline/
├── sources/
│   ├── bse-filings.ts       First to build — BSE bulk download
│   ├── pib-rss.ts           PIB RSS feed parser
│   ├── news-rss.ts          ET/BS/Mint RSS aggregator
│   ├── cppp-scraper.ts      Playwright scraper for tenders
│   └── pdf-fetcher.ts       Downloads annual reports + concalls
└── extract/
    ├── extract-announcement.ts   Claude API extraction for BSE/PIB/news
    ├── extract-tender.ts         Structured tender data from raw text
    └── extract-promise.ts        Management promises from PDFs
```

---

## Fonts

```ts
// In layout.tsx
import { Space_Grotesk, DM_Sans, DM_Mono } from "next/font/google";

// Space_Grotesk → display text, financial figures, numbers (font-display)
// DM_Sans       → body text (font-sans)
// DM_Mono       → code, tickers (font-mono)
```

---

## Sector Colours (used consistently across all pages)

Defined in `src/lib/seed-data.ts` — must stay consistent across seed data, DB seed script, and any hardcoded references.

| Sector                    | Hex       |
| ------------------------- | --------- |
| Defence & Aerospace       | `#1d4ed8` |
| Railways                  | `#7c3aed` |
| Roads & Highways          | `#b45309` |
| Energy & Power            | `#047857` |
| Semiconductors            | `#be123c` |
| Heavy Engineering         | `#0369a1` |
| Shipping & Ports          | `#0f766e` |
| Nuclear                   | `#6d28d9` |
| Chemicals & Fertilizers   | `#b45309` |
| Data Centres & AI Infra   | `#0c4a6e` |

---

## Status Colours

| Status                    | Colour   |
| ------------------------- | -------- |
| Proposed / Announced      | Amber    |
| Notified                  | Sky blue |
| Implemented / Operational | Emerald  |
| Disbursing                | Green    |
| Stalled / Cancelled       | Rose     |
| Completed                 | Gray     |

---

## Environment Variables

```
DATABASE_URL        Supabase Transaction Pooler (port 6543) — for Prisma queries
DIRECT_URL          Supabase Direct Connection (port 5432) — for migrations only
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    Server-side only — never expose to browser
```

See `.env.example` for full template.
