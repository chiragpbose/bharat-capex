# BharatCapex — Vision, Status & Roadmap

> Last updated: May 2026  
> This file is the shared reference between Chirag and Claude. Update it whenever a phase completes or the plan changes.

---

## 1. The Dream

India is going through its biggest industrial expansion since independence. The government is deploying capital at a scale not seen before — PLI schemes, a ₹100L cr infrastructure pipeline, defence indigenisation, a semiconductor push, nuclear energy opening up to private players. This isn't a short cycle. It's a decade-long structural shift.

Most retail investors miss the chain:

```
Policy Reform → Government Scheme → Tender Awarded → Company Order Book → Stock Price
```

By the time something shows up in a company's quarterly results, the smart money has already moved. **BharatCapex makes the entire chain visible, trackable, and searchable — automatically.**

**Primary purpose:** Personal investment research OS — a tool to build conviction on which NSE/BSE-listed companies are structurally positioned to win from India's industrial buildout, before the thesis shows up in earnings.

**Secondary purpose:** Share with friends, family, and fellow investors who follow the same macro thesis.

**Monetisation:** Not a current goal. May become relevant later if the data and product prove genuinely useful to a wider audience.

**The edge it gives an investor:**

- Reforms are the _leading indicator_ — they signal where money will flow 12–18 months out
- Tenders are the _coincident indicator_ — they show where money is flowing right now
- Company order books are the _stock catalyst_ — who is capturing it, and at what scale
- Management promises vs. delivery is the _quality filter_ — separating execution-first companies from story stocks

**Crucially:** Chirag is not starting with a pre-defined stock watchlist. He has a thesis. The platform must surface the relevant companies automatically from the policy-tender chain — not require him to know them in advance.

```
Reform notified (e.g. Nuclear sector opens to private players)
        ↓
Platform identifies: which NSE/BSE companies operate in this space?
        ↓
Surfaces: NTPC, L&T (EPC), Tata Power, Thermax (equipment)
        ↓
Chirag reviews: order books, management promises, valuations
        ↓
Build conviction. Hold 2–3 years.
```

---

## 2. The Product

**Name:** BharatCapex  
**URL:** bharatcapex.in (planned)  
**Primary user:** Chirag — personal investment research. Secondarily, friends, family, fellow investors.

**Core sections:**
| Section | What it does |
|---|---|
| Homepage | Feed-first view of latest automated activity (tenders + reform moves), sector capex bars, company movers |
| Reforms | Every major policy reform — status tracked from Proposed → Notified → Implemented → Operational |
| Tenders | Contract awards feed — which listed company won what, for how much, under which scheme |
| Schemes | PLI, Gati Shakti, Sagarmala, etc. — outlay, disbursement progress, beneficiary companies |
| Companies | NSE/BSE-listed companies — financials, order book, tenders won, linked reforms, scheme beneficiary status |
| Promises | Management accountability tracker — what was said, by whom, by when, and whether it happened |
| Calendar | Forward-looking policy events — PLI disbursement deadlines, budget dates, scheme windows, upcoming tenders |

**Value proposition in one line:**  
_"See the government's money move before the market does."_

**What BharatCapex is NOT:**

- Not a trading signal tool — it will not tell you to buy today because a tender was announced today
- Not a real-time price tracker — use Screener.in or Tijori for that
- Not a tips platform — it builds conviction over 2–3 year horizons, not 2–3 day trades

---

## 3. Tech Stack

| Layer         | Technology                                         | Notes                                                                  |
| ------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Framework     | Next.js 16.2.6 (App Router)                        | `params` is `Promise<{...}>`, must `await params`                      |
| Language      | TypeScript                                         | Strict mode                                                            |
| Styling       | Tailwind CSS v4                                    | `@theme inline`, canonical class form e.g. `supports-backdrop-filter:` |
| UI Components | shadcn/ui (base-ui variant)                        | Uses `@base-ui/react` not `@radix-ui`                                  |
| Fonts         | Space Grotesk (display) · DM Sans (body) · DM Mono | All via `next/font/google`                                             |
| ORM           | Prisma 7.8.0                                       | Requires `prisma.config.ts` + driver adapter — see notes               |
| Database      | Supabase (PostgreSQL)                              | **NOT YET CONNECTED**                                                  |
| Validation    | Zod v4.4.3                                         | `z.record(z.string(), z.unknown())` — `.refine()` API changed          |
| React         | v19                                                | `<Context value={...}>` not `<Context.Provider>`                       |

**Critical Prisma 7 gotchas:**

- Config lives in `prisma.config.ts`, not inside `schema.prisma`
- Generator: `provider = "prisma-client"`, output: `../src/generated/prisma`
- Import from `@/generated/prisma/client` (no index.ts generated)
- Constructor requires driver adapter: `new PrismaClient({ adapter: new PrismaPg(pool) })`
- DB client lives at `src/lib/db.ts` using singleton pattern

**Data pipeline stack (to be built):**
| Layer | Technology | Notes |
|---|---|---|
| Scraping (static) | Cheerio + node-fetch | PIB, news sites, ministry pages |
| Scraping (JS-heavy) | Playwright | CPPP, GeM, BSE bulk download |
| PDF extraction | pdf-parse + Claude API | Annual reports, concall transcripts |
| AI processing | Claude API (claude-sonnet-4-20250514) | Entity extraction, company tagging, promise detection |
| Job scheduling | Supabase Edge Functions or node-cron | Runs scrapers on schedule |
| Raw storage | Supabase Storage | Stores raw HTML, PDFs before processing |

---

## 4. What's Been Built

### Pages

| Route               | Status       | Notes                                                                              |
| ------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `/`                 | ✅ Complete  | Feed-first, 3 signal cards, activity feed, dual-bar sector chart, company movers   |
| `/reforms`          | ✅ Complete  | LinkedIn-style dropdown filters (Status + Sector), reform cards with status stripe |
| `/reforms/[slug]`   | ✅ Complete  | Journey tracker, money metrics, beneficiary companies, related reforms             |
| `/companies`        | ✅ Complete  | Sector filter pills, company cards, dual-bar sector overview chart                 |
| `/companies/[slug]` | ✅ Complete  | Financials, tenders won, related reforms, sector exposure                          |
| `/tenders`          | ✅ Complete  | Sector filter, tender feed with value + company + scheme                           |
| `/schemes`          | ✅ Complete  | Disbursement progress bars, investment multiplier, jobs targeted                   |
| `/schemes/[slug]`   | ✅ Complete  | Full scheme detail, listed beneficiaries, linked reforms, related schemes          |
| `/promises`         | ❌ Not built | Management accountability tracker                                                  |
| `/calendar`         | ❌ Not built | Forward-looking policy + scheme event calendar                                     |
| `/contribute`       | ❌ Not built | Deferred indefinitely — no public users, no community layer needed yet             |
| `/news`             | ❌ Not built | Will be replaced by automated pipeline feed, not a manual page                     |

### Key files

```
src/
├── app/
│   ├── page.tsx                    Homepage
│   ├── reforms/page.tsx            Reforms listing
│   ├── reforms/[slug]/page.tsx     Reform detail
│   ├── companies/page.tsx          Companies listing
│   ├── companies/[slug]/page.tsx   Company detail
│   ├── tenders/page.tsx            Tenders feed
│   ├── schemes/page.tsx            Schemes listing
│   └── schemes/[slug]/page.tsx     Scheme detail
├── components/
│   ├── layout/nav.tsx              Sticky nav
│   └── reforms/reform-filters.tsx  Client dropdown filters
├── lib/
│   ├── seed-data.ts                ← ALL PAGES USE THIS RIGHT NOW (to be replaced)
│   └── db.ts                       Prisma singleton (ready, DB not connected)
└── generated/prisma/               Prisma client (generated, gitignored)

prisma/
├── schema.prisma                   Full DB schema (13 models)
└── prisma.config.ts                Prisma 7 config
```

### Data currently in seed-data.ts

- **10 sectors** with govt outlay + order book figures
- **6 reforms** (Defence FDI, PLI Semicon, Gati Shakti, Nuclear private, DFC, Ship recycling)
- **6 companies** (LT, BEL, RVNL, KNRCON, Cochin Shipyard, NTPC)
- **5 tenders**
- **7 schemes** (PLI Semicon, Gati Shakti, PLI Defence, PLI Solar, Sagarmala, Green H₂, PLI Telecom)
- All figures are realistic estimates, not actual verified data

### Design system

- Warm off-white background with subtle dot grid texture
- Classic blue-600 (`oklch(0.546 0.245 262)`) as primary accent
- Each sector has its own hex colour used consistently across all pages
- Status colours: amber=proposed, sky=notified, emerald=implemented/operational, rose=stalled
- Financial figures always use `font-display` (Space Grotesk) + `tabular-nums`
- Money pill colours: violet=outlay, emerald=FDI/order book, blue=market opportunity

---

## 5. Current Limitations

1. **Zero real data** — Everything is hardcoded in `seed-data.ts`. The product looks complete but contains no verified information.
2. **No database connection** — Supabase project not yet created. Schema is written and validated, waiting for credentials.
3. **No data pipeline** — No scrapers, no AI extraction, no scheduled jobs. All data is static and manual.
4. **No search** — Can't search across companies, reforms, or tenders.
5. **No auth** — No user accounts, no watchlists, no personalisation.
6. **No admin panel** — Only needed if manual entry is ever required. Not priority.
7. **Company discovery is missing** — The platform cannot yet surface companies from reforms/tenders automatically. This is core to the vision.

---

## 6. High-Level Roadmap

### Phase 1 — Real Data (CURRENT PRIORITY)

Connect the database and activate the automated data pipeline. This is what turns a prototype into a tool that actually earns money in the market.

**The pipeline architecture:**

```
Sources → Scrapers/Fetchers → Raw Storage → AI Extraction → Structured DB → Frontend
```

### Phase 2 — Company Discovery Engine

The platform surfaces relevant NSE/BSE-listed companies automatically from the policy-tender chain. A new reform triggers a lookup: which companies operate in this sector? Which have won related tenders? This is the core investment utility.

### Phase 3 — Conviction-Building Features

Management Promises tracker, Policy Calendar, Budget Tracker. These are the features that differentiate BharatCapex from anything else available.

### Phase 4 — User Features

Search, watchlists, email digest. Requires auth (Supabase Auth). Only needed once the data is real and the personal utility is proven.

### Phase 5 — Reassess Monetisation

If the product proves genuinely useful and the data is solid, revisit: freemium subscription, API access for other tools, or B2B data licensing. Not before Phase 4.

---

## 7. Immediate Next Steps

### Step 1: Connect Supabase

1. Create project at supabase.com — choose `ap-south-1` (Mumbai)
2. Copy `.env.example` to `.env`
3. Fill in `DATABASE_URL` (Transaction pooler, port 6543) and `DIRECT_URL` (Direct, port 5432)
4. Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
5. Run `npx prisma db push` — creates all tables

### Step 2: Build the BSE filings scraper (first pipeline)

BSE company announcements are the highest-ROI first source. Structured, free, reliable, updated daily. Covers order wins, quarterly results, capex announcements for every listed company.

File: `src/lib/pipeline/sources/bse-filings.ts`

What it does:

- Fetches BSE bulk announcement download (CSV/XML — available free)
- Filters for announcement types relevant to the thesis: order wins, capex guidance, quarterly results, scheme-related filings
- Stores raw announcements in Supabase Storage

### Step 3: Build the AI extraction layer

File: `src/lib/pipeline/extract/extract-announcement.ts`

What it does:

- Sends raw BSE announcement text to Claude API
- Prompt: "Extract: company name, ticker, announcement type, contract value if present, counterparty (awarding authority), sector, scheme if mentioned. Return as JSON."
- Writes structured output to DB via Prisma

### Step 4: Add PIB + news RSS feeds

File: `src/lib/pipeline/sources/rss-feeds.ts`

Sources (all free, no scraping needed):

- PIB RSS: `https://pib.gov.in/RssMain.aspx`
- Economic Times infrastructure RSS
- Business Standard economy RSS
- Each item goes through the same AI extraction pipeline as BSE announcements

### Step 5: CPPP tender scraper

File: `src/lib/pipeline/sources/cppp-scraper.ts`

Hardest source but highest signal for the Tenders section. Requires Playwright (JS-heavy site). Build after the RSS pipeline is proven.

### Step 6: PDF pipeline for Management Promises

File: `src/lib/pipeline/sources/pdf-fetcher.ts`

- Downloads annual reports and concall transcripts from BSE filings
- Sends to Claude API with a specific prompt to extract management promises
- Populates the `ManagementPromise` table automatically

### Step 7: Switch pages off seed-data

Replace all `import { ... } from "@/lib/seed-data"` with queries through `src/lib/db.ts`.

Data access layer at `src/lib/data/`:

- `src/lib/data/reforms.ts`
- `src/lib/data/companies.ts`
- `src/lib/data/tenders.ts`
- `src/lib/data/schemes.ts`
- `src/lib/data/sectors.ts`

### Step 8: Build remaining UI (Phase 3)

Once real data is flowing:

**Management Promises** `/promises` + section on `/companies/[slug]`

- Quote, speaker, source type (concall / annual report / AGM / exchange filing), date, deadline, status, resolution
- The most unique feature on the platform — no other tool tracks this

**Policy Calendar** `/calendar`

- Forward-looking: PLI disbursement deadlines, budget dates, scheme windows, upcoming tender floats
- Month/week view, filterable by sector

**Budget Tracker** `/budget`

- Union Budget allocations by sector, year-over-year
- Bar chart: which sectors got more/less than previous year

---

## 8. Data Source Map

| Source                    | Signal type                             | Method            | Priority  | Cost       |
| ------------------------- | --------------------------------------- | ----------------- | --------- | ---------- |
| BSE bulk download         | Order wins, results, capex guidance     | Playwright / API  | 🔴 First  | Free       |
| PIB RSS                   | Reform notifications, scheme disbursals | RSS parser        | 🔴 First  | Free       |
| News RSS (ET, BS, Mint)   | Sector news, tender coverage            | RSS parser        | 🔴 First  | Free       |
| NITI Aayog                | Policy documents, sector outlooks       | Playwright + PDF  | 🟡 Second | Free       |
| Ministry websites         | Scheme notifications, press releases    | Playwright        | 🟡 Second | Free       |
| CPPP                      | Raw tender awards                       | Playwright (hard) | 🟡 Second | Free       |
| GeM portal                | Procurement data                        | API (limited)     | 🟢 Third  | Free       |
| Annual reports / concalls | Management promises                     | PDF + Claude API  | 🟡 Second | API cost   |
| X / Twitter               | Real-time community signal              | X API (expensive) | 🔵 Defer  | ₹8k+/month |

**On X/Twitter:** The infra investing community on X is the best real-time signal source. But API access is prohibitively expensive for personal use. Practical approach for now: manually save high-signal tweets via a bookmarklet → auto-tagged into DB. Revisit programmatic access if budget allows later.

---

## 9. Product Decisions Made

- **No orange** — more professional feel, use blue-600 as primary
- **Hybrid feed design** — not Bloomberg-dense, not editorial-only. 3 highlight cards + scannable feed rows
- **Sector dual bars** — govt outlay vs listed company order book (the gap tells a story)
- **LinkedIn-style dropdowns** — not tab bars or checkbox lists for filters
- **Feed-first homepage** — returning investor doesn't need the hero explained every time; hero shrunk to slim strip
- **Seed data first** — build UI without DB, switch later. Allows fast iteration on design. ✅ Done.
- **Space Grotesk** — replaced Instrument Serif (too Times New Roman) for display/numbers
- **No manual data entry** — all data flows from automated pipeline. No admin forms, no TypeScript editing.
- **No community contributions (yet)** — no public users, no need. Defer indefinitely.
- **No monetisation (yet)** — build for personal use first. Let the product prove its value before commercialising.
- **Company discovery over watchlists** — Chirag doesn't start with known stocks. The platform surfaces companies from the policy-tender chain. Discovery is the core utility.
- **2–3 year conviction horizon** — BharatCapex is not a trading tool. It is a research tool for long-hold positions driven by structural policy tailwinds.

---

## 10. The Bigger Picture

Once the data pipeline is live and real investment utility is proven:

- **State-level tracker** — not just central govt, but state industrial policies (Gujarat, Maharashtra, Tamil Nadu are most active)
- **Email digest** — "This week in India capex" — weekly summary of biggest tenders, reform moves, company order wins
- **API** — let other tools (screeners, portfolio trackers) pull this data. B2B licensing may be faster revenue than B2C subscription.
- **Mobile app** — eventually, once the web product is proven
- **Monetisation** — freemium: basic data free, deep company intelligence + alerts behind a subscription (~₹999–2,999/month for a professional tier). SEBI Research Analyst registration may be required before formal monetisation.

---

_Next session: Connect Supabase. Build the BSE filings scraper. First real data in the DB._
