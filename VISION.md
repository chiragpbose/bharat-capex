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

By the time something shows up in a company's quarterly results, the smart money has already moved. **BharatCapex makes the entire chain visible, trackable, and searchable — in real time.**

**Dual purpose:**
- **Civic transparency** — citizens can see where public money is going and whether reforms are actually being implemented
- **Investment research** — investors can identify which listed companies are positioned to capture government capex before it shows up in earnings

**The edge it gives an investor:**
- Reforms are the *leading indicator* — they signal where money will flow
- Tenders are the *coincident indicator* — they show where money is flowing right now
- Company order books are the *stock catalyst* — who is capturing it, and at what scale

---

## 2. The Product

**Name:** BharatCapex  
**URL:** bharatcapex.in (planned)  
**Target user:** Retail investors and analysts tracking India's infrastructure and manufacturing buildout

**Core sections:**
| Section | What it does |
|---|---|
| Homepage | Feed-first view of latest activity (tenders + reform moves), sector capex bars, company movers |
| Reforms | Every major policy reform — status tracked from Proposed → Notified → Implemented → Operational |
| Tenders | Contract awards feed — which listed company won what, for how much, under which scheme |
| Schemes | PLI, Gati Shakti, Sagarmala, etc. — outlay, disbursement progress, beneficiary companies |
| Companies | NSE/BSE-listed companies — financials, order book, tenders won, linked reforms, scheme beneficiary status |

**Value proposition in one line:**  
*"See the government's money move before the market does."*

---

## 3. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router) | `params` is `Promise<{...}>`, must `await params` |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS v4 | `@theme inline`, canonical class form e.g. `supports-backdrop-filter:` |
| UI Components | shadcn/ui (base-ui variant) | Uses `@base-ui/react` not `@radix-ui` |
| Fonts | Space Grotesk (display) · DM Sans (body) · DM Mono | All via `next/font/google` |
| ORM | Prisma 7.8.0 | Requires `prisma.config.ts` + driver adapter — see notes |
| Database | Supabase (PostgreSQL) | **NOT YET CONNECTED** |
| Validation | Zod v4.4.3 | `z.record(z.string(), z.unknown())` — `.refine()` API changed |
| React | v19 | `<Context value={...}>` not `<Context.Provider>` |

**Critical Prisma 7 gotchas:**
- Config lives in `prisma.config.ts`, not inside `schema.prisma`
- Generator: `provider = "prisma-client"`, output: `../src/generated/prisma`
- Import from `@/generated/prisma/client` (no index.ts generated)
- Constructor requires driver adapter: `new PrismaClient({ adapter: new PrismaPg(pool) })`
- DB client lives at `src/lib/db.ts` using singleton pattern

---

## 4. What's Been Built

### Pages

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ Complete | Feed-first, 3 signal cards, activity feed, dual-bar sector chart, company movers |
| `/reforms` | ✅ Complete | LinkedIn-style dropdown filters (Status + Sector), reform cards with status stripe |
| `/reforms/[slug]` | ✅ Complete | Journey tracker, money metrics, beneficiary companies, related reforms |
| `/companies` | ✅ Complete | Sector filter pills, company cards, dual-bar sector overview chart |
| `/companies/[slug]` | ✅ Complete | Financials, tenders won, related reforms, sector exposure |
| `/tenders` | ✅ Complete | Sector filter, tender feed with value + company + scheme |
| `/schemes` | ✅ Complete | Disbursement progress bars, investment multiplier, jobs targeted |
| `/schemes/[slug]` | ✅ Complete | Full scheme detail, listed beneficiaries, linked reforms, related schemes |
| `/contribute` | ❌ Not built | Community submission form |
| `/news` | ❌ Not built | Curated news feed |

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
3. **No search** — Can't search across companies, reforms, or tenders.
4. **No auth** — No user accounts, no watchlists, no personalisation.
5. **No admin panel** — Can only add data by editing TypeScript files.
6. **No scrapers** — Data entry is 100% manual.

---

## 6. High-Level Roadmap

### Phase 1 — Real Data (CURRENT PRIORITY)
Connect the database and fill it with accurate, sourced information. This is what turns a prototype into a product.

### Phase 2 — Content Depth
Pages that require data to be useful: Management Promises, Policy Calendar, News Feed, Budget Tracker.

### Phase 3 — User Features
Search, watchlists, email digest. Requires auth (Supabase Auth).

### Phase 4 — Data Pipelines
Admin panel → community contributions → eventually automated scrapers.

---

## 7. Immediate Next Steps (Low Level)

### Step 1: Connect Supabase
1. Create project at supabase.com — choose `ap-south-1` (Mumbai)
2. Copy `.env.example` to `.env`
3. Fill in `DATABASE_URL` (Transaction pooler, port 6543) and `DIRECT_URL` (Direct, port 5432)
4. Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
5. Run `npx prisma db push` — creates all tables

### Step 2: Write the seed script
File: `prisma/seed.ts`  
Real data to include:
- **~25 companies** — large caps (LT, BEL, NTPC, HAL, RVNL), mid caps (KNR, IRCON, Titagarh, Mazagon Dock, BEML, Cochin Shipyard, BHEL), emerging (Dixon, Kaynes, Waaree, Premier Energies)
- **~40 reforms** — covering all 10 sectors, spanning 2014–2025
- **~80 tenders** — sourced from NHAI, MoD, Railways, NTPC, Sagarmala press releases
- **10 schemes** — all major PLI schemes + infra programs
- All entries must have a real `sourceUrl` (PIB, ministry website, BSE filing)

### Step 3: Switch pages off seed-data
Replace all `import { ... } from "@/lib/seed-data"` with queries through `src/lib/db.ts`.
Create a proper data access layer at `src/lib/data/`:
- `src/lib/data/reforms.ts`
- `src/lib/data/companies.ts`
- `src/lib/data/tenders.ts`
- `src/lib/data/schemes.ts`
- `src/lib/data/sectors.ts`

### Step 4: Build remaining UI (Phase 2)
Once real data is flowing:

**Management Promises** `/companies/[slug]` gets a new section + standalone `/promises` page
- Fields: quote, speaker, source (concall/annual report), date made, deadline, status (pending/delivered/missed), resolution
- This is the most unique feature — no other platform tracks this

**Policy Calendar** `/calendar`
- Forward-looking: PLI disbursement deadlines, budget dates, scheme windows, upcoming tender floats
- Simple month/week view, filterable by sector

**News Feed** `/news`
- Curated articles tagged to company + sector + reform
- Not a scraper — manually logged with source URL + relevance tags

**Budget Tracker** `/budget`
- Union Budget allocations by sector, year-over-year
- Bar chart: which sectors got more/less than last year

---

## 8. Product Decisions Made

- **No orange** — more professional feel, use blue-600 as primary
- **Hybrid feed design** — not Bloomberg-dense, not editorial-only. 3 highlight cards + scannable feed rows
- **Sector dual bars** — govt outlay vs listed company order book (the gap tells a story)
- **LinkedIn-style dropdowns** — not tab bars or checkbox lists for filters
- **Feed-first homepage** — returning investor doesn't need the hero explained every time; hero shrunk to slim strip
- **Seed data first** — build UI without DB, switch later. Allows fast iteration on design.
- **Space Grotesk** — replaced Instrument Serif (too Times New Roman) for display/numbers

---

## 9. The Bigger Picture

Once the data is real and the product is launched, the natural extensions are:

- **State-level tracker** — not just central govt, but state industrial policies (Gujarat, Maharashtra, Tamil Nadu are most active)
- **Email digest** — "This week in India capex" — weekly summary of biggest tenders, reform moves, company order wins
- **API** — let other tools (screeners, portfolio trackers) pull this data
- **Mobile app** — eventually, once the web product is proven
- **Monetisation** — freemium: basic data free, deep company intelligence + alerts behind a subscription (~₹499–999/month)

---

*Go sleep. Come back and we'll connect the database.*
