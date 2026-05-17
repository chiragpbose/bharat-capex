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
  import { Pool } from "pg";
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
│   ├── schema.prisma          Full DB schema — 13 models + RawAnnouncement
│   └── prisma.config.ts       Prisma 7 config (required)
│
├── src/
│   ├── app/
│   │   ├── page.tsx           Homepage ✅
│   │   ├── reforms/           Listing + [slug] detail ✅
│   │   ├── tenders/           Listing ✅
│   │   ├── companies/         Listing + [slug] detail ✅
│   │   └── schemes/           Listing + [slug] detail ✅
│   │
│   ├── components/
│   │   ├── ui/                shadcn/ui components (badge, button, card, select...)
│   │   ├── layout/nav.tsx     Sticky nav
│   │   └── reforms/           reform-card.tsx, reform-filters.tsx
│   │
│   ├── lib/
│   │   ├── db.ts              Prisma singleton — use this everywhere
│   │   ├── utils.ts           cn() helper
│   │   ├── validations/       Zod schemas (reform, tender, company)
│   │   ├── data/              reforms.ts · companies.ts · tenders.ts · schemes.ts · sectors.ts ✅
│   │   └── pipeline/
│   │       ├── run.ts         Orchestrator — npm run pipeline:run
│   │       ├── check-data.ts  Diagnostic — inspect what's stored
│   │       ├── sources/
│   │       │   ├── nse-filings.ts    NSE corporate announcements ✅
│   │       │   ├── pib-rss.ts        PIB press releases ✅
│   │       │   ├── news-rss.ts       ET/BS/Mint RSS ✅
│   │       │   ├── niti-scraper.ts   NITI Aayog publications ✅
│   │       │   ├── cppp-scraper.ts   CPPP high-value tenders ✅
│   │       │   └── bse-filings.ts    Stub — replaced by NSE
│   │       └── extract/
│   │           └── extract-announcement.ts  Claude Haiku extraction ✅
│   │
│   └── generated/prisma/      Auto-generated Prisma client — never edit manually
│
├── CLAUDE.md                  ← You are here
├── VISION.md                  Full product vision and roadmap
└── .env.example               Copy to .env — fill Supabase + Anthropic credentials
```

---

## Current State

> **Update this section at the start or end of every session.**

### What's built

- ✅ All 8 pages complete with full UI (homepage, reforms, tenders, companies, schemes + detail pages)
- ✅ All pages wired to real DB queries — seed-data.ts fully gone
- ✅ Full data access layer: `src/lib/data/` — reforms.ts, companies.ts, tenders.ts, schemes.ts, sectors.ts
- ✅ Design system (Space Grotesk + DM Sans, sector colours, status colours)
- ✅ Prisma schema written and validated (13 models + RawAnnouncement)
- ✅ `src/lib/db.ts` — Prisma singleton with pg driver adapter
- ✅ Data pipeline — 5 live sources + AI extraction layer:
  - `sources/nse-filings.ts` — NSE corporate announcements (desc denylist + broad signal keywords)
  - `sources/pib-rss.ts` — PIB press releases with correct English PRID lookup
  - `sources/news-rss.ts` — ET Markets, ET Stocks, ET Industry, BS Markets, Mint RSS
  - `sources/niti-scraper.ts` — NITI Aayog publications page (HTML scrape, no RSS)
  - `sources/cppp-scraper.ts` — CPPP high-value tenders (HTTP + CAPTCHA alt-text bypass, no Playwright)
  - `extract/extract-announcement.ts` — Claude Haiku extraction (isRelevant, type, valueCrore, summary)
  - `run.ts` — orchestrates all 5 sources then extraction

### What's not built yet

- ❌ Structured tables empty — Sector, Company, Reform, Scheme, Tender have no data; pipeline writes to RawAnnouncement only; Phase 2 company discovery engine will promote extracted signals into these tables
- ❌ Anthropic API key — `.env` has placeholder; Claude extraction won't run until replaced
- ❌ Nightly pipeline schedule — runs manually via `npm run pipeline:run`; no cron set up yet
- ❌ /promises page (Management Promises tracker)
- ❌ /calendar page (Policy Calendar)
- ❌ /budget page (Budget Tracker)
- ❌ Annual reports / concall PDF pipeline (ManagementPromise source)
- ~~CPPP "Result of Tenders"~~ — investigated and closed; NSE filings cover this better

### Currently working on

→ Next: set Anthropic API key → run pipeline → verify extractions. Structured tables will be populated by the company discovery engine (Phase 2), not by manual seeding.

---

## How to Work With Chirag

Chirag is simultaneously learning four things through this project:

1. **Software engineering** — backend patterns, databases, APIs, data pipelines (frontend is already comfortable)
2. **Product thinking** — how to prioritise, what to build and what to defer, how to think about users
3. **Stock markets** — how to read company fundamentals, what order books mean, how to build conviction
4. **Policy & economy** — how government capex works, what PLI schemes actually do, how reforms translate to investment theses

**Every time you write or change code, explain:**

- **What** you're building (one sentence)
- **Why** this approach over alternatives (the tradeoff)
- **How it connects** to the broader product or investment thesis where relevant

Keep explanations high-to-medium level. Not line-by-line ("this loop iterates...") but not just "done" either. Think: smart colleague briefing another smart colleague who is new to this specific domain.

Examples of the right level:

- "We're using a singleton pattern for the Prisma client because Next.js hot-reloads the server on every file change during development — without it, you'd exhaust your DB connection pool within minutes."
- "BSE bulk announcements are the highest-ROI first data source because they're free, structured (CSV), updated daily, and cover every listed company automatically — unlike scraping individual company pages."
- "This is a Server Component by default, meaning it runs on the server and sends plain HTML to the browser. We only switch to a Client Component when we need interactivity like the dropdown filters."

---

## Rules — Never Break These

1. **No manual data entry.** All data flows from the automated pipeline. Never suggest forms for admins to type in tenders or reforms.

2. **Never import from `@prisma/client`.** Always `@/generated/prisma/client`.

3. **No community contribution features.** No public users, no submission forms, no moderation queue. Deferred indefinitely.

4. **No monetisation features.** No subscription walls, payment flows, or premium tiers. Not the current goal.

5. **No manual data entry — ever.** This means no seed scripts, no hardcoded bootstrap data, no manually researched figures written into Prisma upserts. If a table is empty, the answer is to build the pipeline step that fills it. Empty pages are acceptable until the automated pipeline does it.

6. **All pages are Server Components by default.** Only reach for `"use client"` when strictly necessary.

---

## Data Pipeline Architecture

```
Sources → Scrapers → RawAnnouncement table → Claude extraction → extractedData JSON → Frontend
```

### Live sources (all in `src/lib/pipeline/sources/`)

| File | Source | Method |
|---|---|---|
| `nse-filings.ts` | NSE corporate announcements | HTTP + homepage cookie; broad keywords + category denylist |
| `pib-rss.ts` | PIB press releases | RSS + 3-step English PRID lookup (matchAll diff-from-Hindi) |
| `news-rss.ts` | ET Markets/Stocks/Industry, BS Markets, Mint | RSS; broad keywords + rupee-with-unit regex |
| `niti-scraper.ts` | NITI Aayog publications | HTML scrape of `/whats-new` — server-rendered Drupal |
| `cppp-scraper.ts` | CPPP high-value tenders (Works/Goods/Services ≥₹1–100cr) | HTTP POST + CAPTCHA bypass — alt text contains the answer |

**Filtering philosophy:** Scrapers cast a wide net (broad keywords). Claude extraction is the real filter. Only categorical denylist at scrape time — AGM/ESOP/dividend `desc` types for NSE, which are categorically never capex signals.

### AI extraction model choice

- **Haiku 4.5** — all announcement/news/tender extraction (fast, cheap, sufficient)
- **Sonnet 4.6** — annual reports, concall PDFs, complex multi-entity documents (not yet built)
- Prompt caching on system prompt — ~90% cost reduction on repeated calls
- Target cost: ~$3–10/month total

### Still to build

- `pdf-fetcher.ts` — downloads annual reports + concall transcripts from NSE filings
- `extract-promise.ts` — Claude Sonnet extraction of management promises from PDFs
- Nightly cron schedule (GitHub Actions or VPS)

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

These are defined in the DB `Sector` model. Must stay consistent across any hardcoded references, DB seed scripts, and the frontend.

| Sector                  | Hex       |
| ----------------------- | --------- |
| Defence & Aerospace     | `#1d4ed8` |
| Railways                | `#7c3aed` |
| Roads & Highways        | `#b45309` |
| Energy & Power          | `#047857` |
| Semiconductors          | `#be123c` |
| Heavy Engineering       | `#0369a1` |
| Shipping & Ports        | `#0f766e` |
| Nuclear                 | `#6d28d9` |
| Chemicals & Fertilizers | `#b45309` |
| Data Centres & AI Infra | `#0c4a6e` |

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
DATABASE_URL              Supabase Transaction Pooler (port 6543) — for Prisma queries
DIRECT_URL                Supabase Direct Connection (port 5432) — for migrations only
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY Server-side only — never expose to browser
ANTHROPIC_API_KEY         Required for Claude extraction — get from console.anthropic.com
```

See `.env.example` for full template.
