# BharatCapex — Claude Code Context

> This file is read by Claude Code at the start of every session.
> Last updated: 2026-05-19. Project paused.

---

## What This Project Is

Personal investment research platform tracking India's industrial buildout.
Maps the chain: **Policy Reform → Scheme → Tender → Company → Stock thesis.**

Primary user: Chirag (the builder). No public users yet.
Full product vision, roadmap, and post-mortem: see `VISION.md`

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
│   │   ├── signals/           Extracted relevant signals feed ✅ (NEW)
│   │   ├── reforms/           Listing + [slug] detail ✅ (but empty — no data in structured tables)
│   │   ├── tenders/           Listing ✅ (but empty)
│   │   ├── companies/         Listing + [slug] detail ✅ (but empty — ~1 company seeded)
│   │   └── schemes/           Listing + [slug] detail ✅ (but empty)
│   │
│   ├── components/
│   │   ├── ui/                shadcn/ui components (badge, button, card, select...)
│   │   ├── layout/nav.tsx     Sticky nav (Signals, Reforms, Tenders, Companies, Schemes)
│   │   └── reforms/           reform-card.tsx, reform-filters.tsx
│   │
│   ├── lib/
│   │   ├── db.ts              Prisma singleton — use this everywhere
│   │   ├── utils.ts           cn() helper
│   │   ├── validations/       Zod schemas (reform, tender, company)
│   │   ├── data/
│   │   │   ├── reforms.ts     ✅ (queries structured Reform table — currently empty)
│   │   │   ├── companies.ts   ✅ (queries structured Company table — ~1 row)
│   │   │   ├── tenders.ts     ✅ (queries structured Tender table — empty)
│   │   │   ├── schemes.ts     ✅ (queries structured Scheme table — empty)
│   │   │   ├── sectors.ts     ✅
│   │   │   └── signals.ts     ✅ (queries RawAnnouncement.extractedData — 3,151 rows)
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
│   │           └── extract-announcement.ts  Groq Llama 3.3 70B extraction ✅
│   │
│   └── generated/prisma/      Auto-generated Prisma client — never edit manually
│
├── .github/workflows/
│   └── pipeline.yml           GitHub Actions cron — daily at 0 2 * * * (7:30 AM IST)
│
├── CLAUDE.md                  ← You are here
├── VISION.md                  Full product vision, roadmap, and post-mortem
└── .env.example               Copy to .env — fill Supabase + Groq credentials
```

---

## Current State (as of 2026-05-19 — project paused)

### What is genuinely working

- ✅ **9 pages** with full UI: homepage, /signals, /reforms (+ detail), /tenders, /companies (+ detail), /schemes (+ detail)
- ✅ **Design system**: Space Grotesk + DM Sans, sector colours, status colours, warm off-white background
- ✅ **Prisma 7 schema**: 13 models + RawAnnouncement, all validated and migrated to Supabase
- ✅ **5 live data scrapers** running daily via GitHub Actions cron (7:30 AM IST):
  - `nse-filings.ts` — NSE corporate announcements (HTTP + Akamai cookie)
  - `pib-rss.ts` — PIB press releases (RSS + PRID English lookup)
  - `news-rss.ts` — ET Markets, ET Stocks, ET Industry, BS Markets, Mint
  - `niti-scraper.ts` — NITI Aayog publications (HTML scrape)
  - `cppp-scraper.ts` — CPPP tenders ≥₹1cr (CAPTCHA bypass via alt-text)
- ✅ **Groq Llama 3.3 70B extraction** — free, 1,000 RPD, ~83 rows/day with current truncation
- ✅ **12-month historical backfill complete**: 15,764 rows in RawAnnouncement
- ✅ **3,151 relevant signals** extracted with structured JSON (isRelevant, type, valueCrore, awardingBody, completionMonths, summary)
- ✅ **`/signals` page** — the only UI page that currently shows real pipeline data; filterable by type and source
- ✅ **Graceful daily quota handling** — detects Groq TPD 429 and exits cleanly instead of crashing

### What is broken or incomplete

- ❌ **Structured tables are empty** — Company, Reform, Tender, Scheme, Sector have almost no data. The pipeline writes only to `RawAnnouncement`. All UI pages except `/signals` show nothing meaningful. This is the central unfinished problem.
- ❌ **No Vercel deployment** — app has never been deployed. No live URL. Runs on localhost only.
- ❌ **Daily extraction limit** — Groq free tier caps at 100k tokens/day. With body truncated at 1,200 chars, ~83 rows/day extractable. Daily new rows from scrapers is ~100–130, so a small backlog accumulates each day. Not critical — pipeline processes newest-first.
- ❌ **No /promises, /calendar, /budget pages** — deferred; require structured data or PDF pipeline to be meaningful
- ❌ **No PDF pipeline** — annual reports and concall transcripts not yet fetched or extracted; ManagementPromise table empty
- ❌ **No company discovery engine** — the step that reads extractedData and promotes signals into Company/Tender structured records has never been built

### What failed and the full honest account

See VISION.md Section 9 (Post-Mortem) for the complete account. Summary:

1. **The $24 Anthropic cost disaster** — prompt caching was claimed to be active and giving ~90% cost reduction. It was silently ignored the entire time. Claude Haiku 4.5 requires system prompt ≥4,096 tokens; ours was ~3,000. All 15,764 rows ran at full price. Cost: ~$24 instead of ~$2–3. User ran out of API credit.

2. **The Gemini detour** — after the Anthropic disaster, switched to Gemini 2.5 Flash. Made claims about API rate limits without consulting actual documentation. 20 RPD limit hit after 14 calls. Wasted time and eroded trust.

3. **Multiple Groq pipeline crashes** — correct choice to use Groq (free), but oversized prompt (3,000 tokens) burned quota in 28 calls/day. Fix applied (prompt trimmed to 750 tokens) but quota detection code had a string mismatch ("PerDay" vs "per day") causing hard crashes instead of graceful exits. Took two more iterations to fully fix.

4. **GitHub Actions secrets misconfiguration** — user stored all secrets as `KEY=value` pairs in one combined secret field. Multiple failed pipeline runs before the issue was diagnosed.

5. **Architectural gap never closed** — the pipeline and the UI were built independently and never connected. The structured tables that the UI reads from were always intended to be populated by a "company discovery engine" (Phase 2) that was perpetually deferred. The result: a fully functional pipeline feeding data into a table that nothing reads, and a polished UI reading from tables that are empty.

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

Keep explanations high-to-medium level. Not line-by-line but not just "done" either.

---

## Rules — Never Break These

1. **No manual data entry.** All data flows from the automated pipeline. Never suggest forms for admins to type in tenders or reforms.

2. **Never import from `@prisma/client`.** Always `@/generated/prisma/client`.

3. **No community contribution features.** No public users, no submission forms, no moderation queue. Deferred indefinitely.

4. **No monetisation features.** No subscription walls, payment flows, or premium tiers. Not the current goal.

5. **No manual data entry — ever.** No seed scripts, no hardcoded bootstrap data, no manually researched figures. If a table is empty, the answer is to build the pipeline step that fills it. Empty pages are acceptable until the automated pipeline does it.

6. **All pages are Server Components by default.** Only reach for `"use client"` when strictly necessary.

7. **Never claim a cost optimisation is working without empirically verifying it.** Check token thresholds, rate limits, and pricing from actual documentation before making any cost estimate or claim. The $24 disaster happened because caching was asserted without verification.

8. **Never make API capability claims without reading the actual docs.** The Gemini detour happened because rate limits were stated from memory rather than verified from documentation.

---

## Data Pipeline Architecture

```
Sources → Scrapers → RawAnnouncement table → Groq extraction → extractedData JSON → /signals page
                                                                                   ↓ (not yet built)
                                                                         Company discovery engine
                                                                                   ↓
                                                              Company / Tender / Reform structured tables
                                                                                   ↓
                                                                    Reforms, Companies, Tenders pages
```

### Live sources (all in `src/lib/pipeline/sources/`)

| File | Source | Method |
|---|---|---|
| `nse-filings.ts` | NSE corporate announcements | HTTP + homepage cookie; broad keywords + category denylist |
| `pib-rss.ts` | PIB press releases | RSS + 3-step English PRID lookup |
| `news-rss.ts` | ET Markets/Stocks/Industry, BS Markets, Mint | RSS; broad keywords + rupee-with-unit regex |
| `niti-scraper.ts` | NITI Aayog publications | HTML scrape of `/whats-new` |
| `cppp-scraper.ts` | CPPP high-value tenders (≥₹1–100cr) | HTTP POST + CAPTCHA bypass via alt-text |

**Filtering philosophy:** Scrapers cast a wide net. Groq extraction is the real filter — broad keywords at scrape time, AI decides relevance. Only categorical denylist at scrape time for NSE (AGM/ESOP/dividend types).

### AI extraction

- **Model**: Groq `llama-3.3-70b-versatile` — free tier, 1,000 RPD, 100k TPD
- **Body truncation**: 1,200 chars — limits per-call token cost, preserves signal quality (title carries most info for NSE; first 1,200 chars covers the lede for news)
- **System prompt**: ~750 tokens (trimmed from 18 to 5 examples — kept ORDER_WIN range midpoint, ROUTINE, CAPEX_PLAN, MANAGEMENT_PROMISE, Hindi input)
- **Capacity**: ~83 rows/day with current settings
- **Quota handling**: detects "per day"/"TPD" in 429 message, exits gracefully rather than crashing

### What the extractedData JSON looks like

```json
{
  "isRelevant": true,
  "type": "ORDER_WIN",
  "valueCrore": 2300,
  "awardingBody": "ONGC",
  "completionMonths": 30,
  "summary": "L&T has secured a ₹2,300 crore order from ONGC to fabricate an offshore oil platform, with completion targeted in 30 months."
}
```

Types: `ORDER_WIN` | `CAPEX_PLAN` | `CAPACITY_EXPANSION` | `MANAGEMENT_PROMISE` | `POLICY_UPDATE` | `ROUTINE` | `OTHER`

### Phase 3 PDF pipeline (not yet built)

For annual reports and concall transcripts: plan is to use **OpenRouter + DeepSeek V3/V4** rather than Claude Sonnet directly. ~20× cheaper, 1M token context, OpenAI-compatible API. Test on one sample PDF before committing to bulk run. See VISION.md for full spec.

---

## Environment Variables

```
DATABASE_URL              Supabase Transaction Pooler (port 6543) — for Prisma queries
DIRECT_URL                Supabase Direct Connection (port 5432) — for migrations only
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY Server-side only — never expose to browser
GROQ_API_KEY              Required for extraction — get from console.groq.com (free)
```

GitHub Actions secrets (each must be a separate secret, not combined):
- `DATABASE_URL`, `DIRECT_URL`, `GROQ_API_KEY`

---

## Fonts

```ts
import { Space_Grotesk, DM_Sans, DM_Mono } from "next/font/google";
// Space_Grotesk → display text, financial figures, numbers (font-display)
// DM_Sans       → body text (font-sans)
// DM_Mono       → code, tickers (font-mono)
```

---

## Sector Colours

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

| Status               | Colour  |
| -------------------- | ------- |
| Proposed / Announced | Amber   |
| Notified             | Sky     |
| Implemented          | Emerald |
| Disbursing           | Green   |
| Stalled / Cancelled  | Rose    |
| Completed            | Gray    |
