# BharatCapex — Vision, Status & Roadmap

> Last updated: 2026-05-17  
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
| Reforms | Every major policy reform — status tracked from Proposed → Notified → Implemented → Operational; thesis health indicator; budget outlay vs. actual spending |
| Tenders | Contract awards feed — which listed company won what, for how much, under which scheme |
| Schemes | PLI, Gati Shakti, Sagarmala, etc. — outlay, disbursement progress, beneficiary companies |
| Companies | Full investment dossier — financials, order book trajectory, OCF vs PAT, promoter activity, promise delivery rate, government receivables, peer comparison, supply chain position, linked reforms |
| Promises | Management accountability tracker — what was said, by whom, by when, and whether it happened; delivery rate score per company |
| Calendar | Forward-looking policy events — PLI disbursement deadlines, budget dates, scheme windows, upcoming tenders |
| Budget | Union Budget allocations by sector, year-over-year comparison, outlay vs. actual spend gap |

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
| Database      | Supabase (PostgreSQL)                              | ✅ Connected — transaction pooler (port 6543) for queries              |
| Validation    | Zod v4.4.3                                         | `z.record(z.string(), z.unknown())` — `.refine()` API changed          |
| React         | v19                                                | `<Context value={...}>` not `<Context.Provider>`                       |

**Critical Prisma 7 gotchas:**

- Config lives in `prisma.config.ts`, not inside `schema.prisma`
- Generator: `provider = "prisma-client"`, output: `../src/generated/prisma`
- Import from `@/generated/prisma/client` (no index.ts generated)
- Constructor requires driver adapter: `new PrismaClient({ adapter: new PrismaPg(pool) })`
- DB client lives at `src/lib/db.ts` using singleton pattern

**Data pipeline stack:**
| Layer | Technology | Notes |
|---|---|---|
| Scraping (static HTML) | Native `fetch` + regex | PIB, NITI Aayog, CPPP (no Cheerio/Playwright needed) |
| Scraping (authenticated) | Native `fetch` + cookie grab | NSE — one homepage fetch for Akamai session cookie |
| Scraping (CAPTCHA) | HTTP POST + alt-text bypass | CPPP — CAPTCHA answer is in the img alt attribute |
| PDF extraction | pdf-parse + Claude API | Annual reports, concall transcripts — not yet built |
| AI processing | Groq Llama 3.3 70B (free) | Extraction for announcements/news; Claude Sonnet for PDFs (not yet built) |
| Job scheduling | GitHub Actions cron | `0 2 * * *` — 7:30 AM IST daily; manual trigger also available |
| Raw storage | `RawAnnouncement` table in Supabase | Stores title/body/source before AI extraction |

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
│   ├── page.tsx                         Homepage — real DB queries ✅
│   ├── reforms/page.tsx                 Reforms listing — real DB queries ✅
│   ├── reforms/[slug]/page.tsx          Reform detail — real DB queries ✅
│   ├── companies/page.tsx               Companies listing — real DB queries ✅
│   ├── companies/[slug]/page.tsx        Company detail — real DB queries ✅
│   ├── tenders/page.tsx                 Tenders feed — real DB queries ✅
│   ├── schemes/page.tsx                 Schemes listing — real DB queries ✅
│   └── schemes/[slug]/page.tsx          Scheme detail — real DB queries ✅
├── components/
│   ├── layout/nav.tsx                   Sticky nav
│   └── reforms/reform-filters.tsx       Client dropdown filters
├── lib/
│   ├── db.ts                            Prisma singleton — use this everywhere
│   ├── utils.ts                         cn() helper
│   ├── data/
│   │   ├── reforms.ts                   ✅
│   │   ├── companies.ts                 ✅
│   │   ├── tenders.ts                   ✅
│   │   ├── schemes.ts                   ✅
│   │   └── sectors.ts                   ✅
│   ├── validations/                     Zod schemas (reform, tender, company)
│   └── pipeline/
│       ├── run.ts                       Pipeline orchestrator — npm run pipeline:run
│       ├── sources/
│       │   ├── nse-filings.ts           NSE corporate announcements ✅
│       │   ├── pib-rss.ts               PIB press releases ✅
│       │   ├── news-rss.ts              ET/BS/Mint RSS feeds ✅
│       │   ├── niti-scraper.ts          NITI Aayog publications ✅
│       │   ├── cppp-scraper.ts          CPPP high-value tenders ✅
│       │   └── bse-filings.ts           Stub — replaced by NSE
│       └── extract/
│           └── extract-announcement.ts  Claude Haiku extraction ✅
└── generated/prisma/                    Auto-generated Prisma client — never edit

prisma/
├── schema.prisma                        Full DB schema (13 models + RawAnnouncement)
└── prisma.config.ts                     Prisma 7 config
```

### Design system

- Warm off-white background with subtle dot grid texture
- Classic blue-600 (`oklch(0.546 0.245 262)`) as primary accent
- Each sector has its own hex colour used consistently across all pages
- Status colours: amber=proposed, sky=notified, emerald=implemented/operational, rose=stalled
- Financial figures always use `font-display` (Space Grotesk) + `tabular-nums`
- Money pill colours: violet=outlay, emerald=FDI/order book, blue=market opportunity

---

## 5. Current Limitations

1. **Structured tables are empty** — All pages are wired to real DB queries, but Sector, Company, Reform, Scheme, and Tender tables have no data. The pipeline only writes to `RawAnnouncement`. These tables will be populated by the company discovery engine (Phase 2), which promotes extracted signals into structured records. No manual seeding.
2. **Claude extraction not yet running** — The extraction layer is built and type-checked, but `ANTHROPIC_API_KEY` in `.env` is still a placeholder. Set the real key → run `npm run pipeline:run` → first signals in `RawAnnouncement` with `extractedData` populated.
3. **No pipeline schedule** — The pipeline runs manually via `npm run pipeline:run`. No cron job or scheduled trigger yet. Needs to be set up to run nightly.
4. **CPPP awarded contracts — closed** — Investigated: endpoint works with `year` parameter, but listing has no value or winner; detail pages are session-locked. NSE filings are the correct source for listed company order wins.
5. **No PDF pipeline** — Annual reports and concall transcripts are the source for the Management Promises tracker. Not yet built — this is Phase 3.
6. **Company discovery is missing** — The platform cannot yet surface companies from reforms/tenders automatically. This is the core investment utility and requires the full pipeline to be running first.
7. **No search** — Can't search across companies, reforms, or tenders. Phase 4.
8. **No auth** — No user accounts, no watchlists, no personalisation. Phase 4.

---

## 6. High-Level Roadmap

### Phase 1 — Real Data (COMPLETE — pipeline running, UI gap remains)

Connect the database, build and activate the automated data pipeline.

**Pipeline architecture:**
```
Sources → Scrapers → RawAnnouncement table → Groq extraction → extractedData JSON → /signals page → Frontend
```

**Done:**
- Supabase connected, schema live, all 8 pages on real DB queries
- 5 scrapers live: NSE filings, PIB RSS, ET/BS/Mint news RSS, NITI Aayog, CPPP
- Groq Llama 3.3 70B extraction layer (free, 1,000 RPD, ~74 rows/day with trimmed prompt)
- GitHub Actions cron running daily at 7:30 AM IST
- 12-month historical backfill: **15,764 rows, 3,151 relevant signals** extracted
- Graceful daily quota handling (no more crashes on TPD limit)

**The gap:** 3,151 signals exist in the DB but are completely invisible — no `/signals` page, and the structured UI tables (Company, Reform, Tender) remain empty. The platform looks empty even though it has a full year of real data. This is the immediate priority.

**Remaining for Phase 1 to feel complete:**
1. Build `/signals` page — surface the 3,151 extracted signals directly from RawAnnouncement
2. Deploy to Vercel — get a live URL
3. Verify Groq TPD fix (tomorrow's cron, 2026-05-18 7:30 AM IST)

### Phase 2 — Company Discovery Engine

The platform surfaces relevant NSE/BSE-listed companies automatically from the policy-tender chain.

**First-order discovery:** When a reform/scheme/tender is detected, identify which NSE/BSE-listed companies operate in that sector. Source: NSE sector index membership lists (scrapeable, no manual entry).

**Second-order inference (supply chain reasoning):** When a high-signal announcement arrives (e.g. PLI semiconductor tranche disbursed), Claude Sonnet runs a second extraction pass identifying:
1. **Direct beneficiaries** — companies that win contracts or receive incentives directly
2. **Upstream suppliers** — industries/companies that supply inputs (e.g. semiconductor fabs → industrial gases → Linde India, INOX Air Products)
3. **Infrastructure enablers** — logistics, construction, utilities that must expand alongside
4. **Contrarian risks** — industries or companies that may be disrupted or displaced

This second-order reasoning is the platform's core differentiation. Most investors see the headline. BharatCapex surfaces the supply chain.

**Supply chain map** — visualised per reform/scheme as a tree: policy → direct beneficiaries → upstream suppliers → enablers.

### Phase 3 — Conviction-Building Features

The full investment dossier on each company. What differentiates BharatCapex from Screener.in or Tijori is that we connect financial quality to the policy-tender chain that's driving it.

**Thesis tracking:**
- **Thesis health indicator** per reform/scheme — 🟢 Active (disbursing, tenders flowing) / 🟡 Delayed (announced, stalled) / 🔴 At risk (cut, restructured)
- **Budget outlay vs. actual spending** — the gap between sanctioned outlay and actual disbursement, by sector. Widening gap = thesis risk. Narrowing = catalyst.
- **Sector cycle position** — Early (policy only) / Inflecting (tenders starting) / Executing (companies winning orders) / Late cycle (visible in earnings, premium priced in)

**Business quality metrics** (sourced from quarterly results PDFs via PDF pipeline):
- **ROCE** — return on capital employed; >15–20% consistently = value-creating business
- **OCF vs PAT chart** — operating cash flow vs. accounting profit, quarterly over 3 years; persistent divergence (PAT rising, OCF flat) = quality red flag; almost no retail tool shows this
- **Order book trajectory** — 6–8 quarters of order book charted, not just current snapshot; trend matters more than the number
- **Revenue growth CAGR** — 3–5 year compound growth; 15%+ in a structural capex theme is the bar
- **Debt/Equity ratio** — <1x and falling over time; rising debt in a government-contract business is dangerous
- **Working capital / debtor days** — how long does money stay stuck; deterioration is an early warning
- **Government receivables** — unique to India's capex theme; companies waiting 6–18 months to be paid by government bodies show cash stress even with strong order books; critical for EPC, infra, defence companies
- **Capital allocation history** — what has management done with cash over 5 years: reinvested, paid dividends, acquired, or let idle; reveals whether management thinks like owners

**Governance and management quality** (sourced from NSE disclosures + PDF pipeline):
- **Promoter activity tracker** — insider buying/selling disclosed monthly to NSE; promoter buying with personal capital (not ESOPs) is one of the strongest possible conviction signals
- **Promoter pledge %** — disclosed quarterly; >20–30% pledging = promoter is personally financially stressed; stressed promoters make bad decisions
- **Promise delivery rate** — computed automatically from the Promises tracker; delivery rate over 2–3 years is the single best proxy for management quality; companies at 85%+ have earned trust
- **Auditor signals** — qualifications, emphasis of matter paragraphs, auditor changes; extracted from annual report PDFs; unexplained auditor change after many years = red flag
- **Related party transactions** — value siphoning mechanism; extracted from annual reports

**Peer comparison table** — for every company, show 3–4 sector peers side by side on ROCE, order book/revenue, D/E, revenue growth; makes relative quality immediately obvious.

**Valuation context** (not a trading signal — conviction context only):
- PE vs. historical range — is the stock cheap or expensive relative to its own history
- Order book visibility premium — justified premium for companies with 3–4 years of locked-in work vs. 1 year

### Phase 4 — User Features

Search, watchlists, email digest. Requires auth (Supabase Auth). Only needed once the data is real and the personal utility is proven.

### Phase 5 — Reassess Monetisation

If the product proves genuinely useful and the data is solid, revisit: freemium subscription, API access for other tools, or B2B data licensing. Not before Phase 4.

---

## 7. Immediate Next Steps

### Step 1: Build `/signals` page ← current priority

The 3,151 extracted relevant signals are in `RawAnnouncement.extractedData` but there is no UI to see them. This is the single most impactful missing feature.

Query: `WHERE processedAt IS NOT NULL AND extractedData->>'isRelevant' = 'true'`, ordered by `publishedAt DESC`.

Each row shows: date · source · type badge (ORDER_WIN / CAPEX_PLAN / etc.) · value (₹X cr) · summary · link to original.
Filters: by type, by value threshold, by source.

This page proves the pipeline is working and makes the platform immediately useful as a research tool.

### Step 2: Deploy to Vercel

Connect GitHub repo to Vercel. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Five minutes.

### Step 3: Verify Groq TPD fix (2026-05-18 morning)

Check GitHub Actions run on 2026-05-18 at 7:30 AM IST. Confirm extraction reaches row 29+ (was crashing at 28 before the prompt trim). If it completes 50/50, the daily pipeline is stable.

### ~~Step 0: Activate Claude extraction~~ — Done (switched to Groq)
### ~~Step: Set up nightly cron~~ — Done (GitHub Actions, 0 2 * * *)
### ~~Step: Investigate CPPP awarded contracts~~ — Done, closed

### Step 4: Company discovery engine (Phase 2)

Once the `/signals` page proves signal quality, start matching company names in `extractedData` back to NSE-listed `Company` records. This populates the structured tables and makes the Reforms/Companies/Sectors pages non-empty.

### Step 5: PDF pipeline for Management Promises (Phase 3)

File: `src/lib/pipeline/sources/pdf-fetcher.ts`

- Downloads annual reports and concall transcripts attached to NSE/BSE filings
- Sends to **Claude Sonnet** (not Groq — PDFs are complex, Sonnet quality justified) with a prompt to extract management promises
- Populates the `ManagementPromise` table — what was said, by whom, by when
- Powers the `/promises` page — the most differentiated feature on the platform
- **Budget carefully** — Anthropic API billed per token. Use Batches API. Verify prompt caching threshold (Sonnet 3.5+ min is 1,024 tokens — much more achievable than Haiku's 4,096).

### Step 6: Build remaining UI pages

**Management Promises** `/promises` + section on `/companies/[slug]`
**Policy Calendar** `/calendar`
**Budget Tracker** `/budget`

---

## 8. Data Source Map

| Source                    | Signal type                                          | Method                     | Status       | Cost       |
| ------------------------- | ---------------------------------------------------- | -------------------------- | ------------ | ---------- |
| NSE corporate filings     | Order wins, capex guidance, contract awards          | HTTP + cookie auth         | ✅ Live      | Free       |
| PIB RSS                   | Reform notifications, scheme disbursals, policy news | RSS parser + HTML scrape   | ✅ Live      | Free       |
| News RSS (ET, BS, Mint)   | Sector news, tender coverage, order win coverage     | RSS parser                 | ✅ Live      | Free       |
| NITI Aayog                | Policy papers, sector roadmaps, strategy documents   | HTML scraper               | ✅ Live      | Free       |
| CPPP high-value tenders   | Open tenders ≥₹1cr–100cr by all central govt bodies  | HTTP + CAPTCHA alt bypass  | ✅ Live      | Free       |
| Annual reports / concalls | Management promises, order book guidance             | PDF + Claude API           | ❌ Not built | API cost   |
| GeM portal                | Government marketplace procurement orders            | API (limited access)       | ❌ Deferred  | Free       |
| X / Twitter               | Real-time community signal, promoter commentary      | X API                      | 🔵 Defer     | ₹8k+/month |
| BSE bulk download         | Same as NSE but harder (Akamai CAPTCHA)              | Playwright (complex)       | ⏭ Replaced  | Free       |

**NSE vs BSE:** NSE's corporate announcements API returns identical data (companies file with both exchanges) and requires only one cookie fetch. BSE's API is blocked by Akamai bot protection requiring Playwright + browser session. NSE is the complete replacement — no data loss.

**CPPP "Result of Tenders" (awarded contracts):** Investigated and closed. The endpoint works when `year` is supplied (that was the missing parameter). However, the listing table contains only AOC date, title, and awarding body — no contract value, no winner name. Both live on session-locked detail pages (signed token URLs that expire in seconds, require a persistent browser session to access — not worth the Playwright complexity). NSE corporate filings are the correct source: every listed company that wins a significant contract files a mandatory exchange disclosure within 24 hours, with company name, value, and awarding body all present.

**Defence sector coverage:** All five sources cover defence. NSE filings catch order wins from HAL, BEL, Mazagon, Cochin Shipyard etc. PIB covers DAC (Defence Acquisition Council) approvals and indigenisation targets. CPPP includes defence ordnance/equipment tenders. Gap: large strategic platform acquisitions (fighter jets, warships, submarines) go through the Defence Acquisition Procedure (DAP), not standard tendering — but those surface in NSE filings within days of contract signing anyway.

**GeM portal:** Deferred. GeM is a marketplace for standardised government purchases — IT hardware, vehicles, solar panels, furniture. It does NOT cover large infrastructure contracts (those go through CPPP/DAP). GeM IS relevant for EV bus procurement (Olectra, Tata Motors), solar panel volumes (Waaree, Vikram), and IT hardware (Dixon, Kaynes). However, listed companies that win GeM contracts also file NSE announcements, so the downstream signal is already captured. Revisit for aggregate sector trend data in Phase 2.

**PIB coverage:** PIB (Press Information Bureau) is the central press release hub for ALL Indian ministries. Ministry-specific websites do not add materially — their announcements route through PIB. NITI Aayog is the exception (they publish independently).

**On X/Twitter:** The infra investing community on X is the best real-time signal source. But API access is prohibitively expensive for personal use. Practical approach: manually save high-signal tweets via a bookmarklet → auto-tagged into DB. Revisit programmatic access if budget allows later.

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

## 10. Key Policy Programmes to Track

These are the structural policy initiatives whose downstream effects BharatCapex exists to map — from scheme → tender → company order book → stock thesis.

| Programme | Outlay | Horizon | Beneficiary sectors |
|---|---|---|---|
| PLI Schemes (14 sectors) | ₹1.97L crore | 2021–2028 | Electronics, Semiconductors, Pharma, Solar, Defence, Textiles |
| Gati Shakti (PM) | ₹100L crore pipeline | 2021–2025+ | Roads, Railways, Ports, Logistics, Energy |
| National Infrastructure Pipeline | ₹111L crore | 2019–2025 | All infrastructure sectors |
| Sagarmala | ₹5.48L crore | 2015–2035 | Ports, Coastal roads, Shipbuilding |
| DPIIT PLI – Semiconductors | ₹76,000cr | 2021–2031 | Fabs, ATMP, chip design |
| National Green Hydrogen Mission | ₹19,744cr | 2023–2030 | Electrolysers, Renewables, Green ammonia |
| Nuclear Energy Expansion | ₹2L+ crore | 2024–2040 | Nuclear, Heavy engineering, EPC |
| Defence indigenisation (iDEX, DAP) | Open-ended | Ongoing | HAL, BEL, Mazagon, L&T Defence |
| Anusandhan National Research Foundation (ANRF) | ₹50,000cr total (₹36k private + ₹14k govt) | 2023–2028 | Deep tech R&D — semiconductors, AI, clean energy, advanced materials |
| Research, Development and Innovation (RDI) Fund | ₹20,000cr | Budget 2025–26, 5-year rollout | Private sector R&D in frontier tech |

**Note on ANRF / RDI Fund:**
The Anusandhan National Research Foundation was established under the ANRF Act 2023. It consolidates India's research funding under one umbrella with ₹50,000cr over five years — the largest science funding commitment in India's history. The Research, Development and Innovation (RDI) Fund (Budget 2025–26, ₹20,000cr) sits alongside it, specifically aimed at private sector R&D with a "challenge" grant model.

**Investment implication:** Companies that win ANRF/RDI grants are typically early-stage in deep tech (semiconductors, biotech, AI hardware). Listed beneficiaries are likely to include: TATA Electronics, Dixon Technologies, Kaynes Technology, HFCL, Apar Industries. These funds are signals of long-horizon thesis validation — track grant announcements for early conviction building.

---

## 11. The Intelligence Layer — Full Feature Specification

Everything in this section is Phase 2 and Phase 3 work. Recorded here so the design intent is not lost between sessions.

### What the company detail page becomes

`/companies/[slug]` is the centrepiece of the product. It goes from showing static financials to a complete investment dossier. No other tool in India combines all of this for retail investors — Screener/Tijori cover financials, Trendlyne covers ownership, nobody connects it to the policy-tender chain driving the cycle.

```
Company: RVNL (Rail Vikas Nigam Ltd)          Quality Score: ●●●○○  72/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTOR CYCLE        SUPPLY CHAIN POSITION       THESIS HEALTH
Executing ●●●○ Late Direct beneficiary          🟢 Active
                    Upstream: Titagarh, HBL     Policy risk: Low

FINANCIALS                         GOVERNANCE
ROCE: 18.4%    D/E: 0.3x          Promoter pledge: 0%
OCF vs PAT: ✅ aligned             Promoter buying: ↑ Mar 2026 (₹12cr)
Order book: ₹84,000cr (4.2×)      Promise delivery rate: 79% 🟡
Govt receivables: 148 days ⚠       Auditor: No qualifications
Export revenue: 2% (flat) —        Key person risk: Low (professional mgmt)
Working capital: ↑ deteriorating ⚠

ORDER BOOK TRAJECTORY (8Q)        EARNINGS: GUIDANCE VS ACTUAL
[bar chart — trend building]      [beat/miss bar chart — 8 quarters]

FORWARD P&L (if mgmt delivers)
Bear: FY28 PAT ₹820cr | Base: ₹1050cr | Bull: ₹1300cr
Assumptions: 4.2× OB/rev maintained, ROCE stable at 18%

INSTITUTIONAL TRENDS              CONCALL SENTIMENT
FII: ↑ +2.1% (3 qtrs)            Q4FY26: Cautious 🟡 (was Confident)
DII: → flat                       Tone shift: hedging on order inflows
MF: Mirae ↑, Parag Parikh ↑

PEER COMPARISON                   VALUATION CONTEXT
RVNL vs IRCON vs KNR vs HG Infra  PE: 22x  |  3yr range: 15–38x
[ROCE / OB ratio / D/E / Rev CAGR] Currently: Middle of historical range
[Dividend / Buyback / Export %]

DIVIDEND & BUYBACK                LINKED REFORMS
FY26: ₹2.20/share (payout 28%)   ■ Railways capex ₹2.62L cr 🟢
FY25: ₹2.00 | FY24: ₹1.75        ■ Kavach rollout 🟡 Delayed
No buybacks — reinvesting in biz  ■ Metro expansion 🟢
```

### Feature-by-feature specification

**Thesis Health Indicator**
- Per reform and per scheme; computed from: disbursement progress, tender activity in last 90 days, PIB/news signals
- 🟢 Active / 🟡 Delayed / 🔴 At risk
- Shown on reform detail page, scheme detail page, and company page (for each linked reform)

**Budget Outlay vs. Actual Spending**
- Sanctioned outlay (from scheme creation) vs. disbursed (updated from PIB/pipeline signals)
- Shown as a progress bar with % deployed; year-over-year comparison
- A gap widening over time = thesis risk; gap closing = upcoming catalyst

**Sector Cycle Position**
- Early (policy announced, no tenders) / Inflecting (tenders starting) / Executing (companies winning orders) / Late (visible in earnings)
- Shown on sector pages and company pages
- Updated by pipeline signals — first tender in a sector moves it from Early to Inflecting

**Supply Chain Map**
- Generated by Claude Sonnet on high-relevance announcements (isRelevant=true + valueCrore > threshold)
- Stored as structured JSON: `{ direct: [...], suppliers: [...], enablers: [...], risks: [...] }`
- Displayed as a tree on reform/scheme detail pages; each node links to the company page if listed

**Second-order extraction pipeline** (`extract-adjacencies.ts`)
- Triggers on: isRelevant=true AND (valueCrore > 500 OR source = PIB/NITI)
- Uses Claude Sonnet (not Haiku — needs deeper reasoning)
- Prompt asks for direct + upstream + enabler + risk companies with NSE tickers
- Output stored in a new `extractedAdjacencies` JSON field on `RawAnnouncement`

**Order Book Trajectory**
- Source: `CompanyFundamentals` table (already in schema — `orderBookCrore` per period)
- Chart: 6–8 quarters; show absolute value + YoY growth rate
- Flag: if order book has shrunk 2+ consecutive quarters, show warning

**OCF vs PAT**
- Source: quarterly results PDFs → PDF pipeline extraction
- Chart: side-by-side bars per quarter over 3 years
- Flag: if OCF < 70% of PAT for 3+ consecutive quarters, show quality warning

**Government Receivables / Debtor Days**
- Source: annual report PDF pipeline (balance sheet — trade receivables / revenue × 365)
- Threshold: >180 days = high risk; >120 days = caution; <90 days = healthy
- Particularly important for: EPC companies (L&T, KNR), railway infra (RVNL, IRCON), defence (HAL, BEL)

**Promoter Activity Tracker**
- Source: NSE bulk/block deals + shareholding disclosures (monthly, public, scrapeable)
- Show: insider buy/sell events as a timeline; net direction over last 12 months
- Highlight: promoter open-market purchases (not ESOPs) as especially high-signal

**Promoter Pledge %**
- Source: NSE shareholding pattern (quarterly)
- Thresholds: <10% safe / 10–25% caution / >25% red flag
- Show trend — pledging increasing over time is worse than a steady high %

**Promise Delivery Rate**
- Computed from `ManagementPromise` table: delivered / (delivered + missed) over last 3 years
- Shown as a % score on the company page
- Colour: >75% green / 50–75% amber / <50% red

**Capital Allocation History**
- Source: 5 years of annual reports — cash flow statement (capex, dividends, acquisitions, cash build)
- Show as a stacked bar per year: how was free cash flow used?
- Flag: >30% going to acquisitions without clear rationale = risk

**Peer Comparison Table**
- Automatically populated from sector membership (NSE sector index)
- Columns: ROCE, D/E, order book/revenue, revenue CAGR, promise delivery rate
- Sortable; current company highlighted

**Valuation Context**
- PE vs. 3-year historical range: shown as a band with current position marked
- PE relative to sector peers: is this company expensive or cheap vs. its direct competitors?
- Not a buy/sell signal — framed as "historical context" only
- Source: NSE price data (public, scrapeable)

**Working Capital Trend**
- Debtor days, creditor days, inventory days — tracked quarterly over 8 quarters
- Chart the trend, not just the number: deteriorating (collecting slower, paying faster) is an early warning of business stress even when revenues look fine
- Flag: if debtor days have risen >30% over 4 quarters, show warning
- Source: quarterly results PDFs → balance sheet items

**Company Quality Scorecard**
- A single composite score per company, combining: ROCE (40%) + debt quality/D/E (20%) + promoter integrity signals (20%) + promise delivery rate (20%)
- Shown as a colour-coded badge on company cards and at the top of the detail page
- Not meant to replace analysis — meant to surface which companies deserve deeper attention
- Recomputed each quarter as new data flows in

**Concall Sentiment Tracker**
- Beyond extracting specific promises, Claude Sonnet reads the tone of concall transcripts over time
- Tracks: is management getting more confident or more defensive? Are they raising guidance or hedging it? Are they talking about growth or explaining delays?
- Displayed as a sentiment trend line: Confident → Cautious → Defensive
- Particularly useful for catching thesis deterioration before it shows in financials
- Source: concall transcripts → PDF pipeline → Claude Sonnet analysis

**Institutional Holding Trends**
- FII (Foreign Institutional Investor), DII (Domestic Institutional), and Mutual Fund % ownership — tracked quarterly
- Direction matters more than absolute level: FIIs accumulating over 3 quarters while DIIs hold steady = smart money building a position
- MF exposure: which funds hold this stock, and are they increasing or reducing?
- "Smart money" signal: if 3+ quality mutual funds (Mirae, Nippon, Parag Parikh) are all increasing exposure, it validates the thesis
- Source: NSE/BSE shareholding pattern (quarterly public disclosure, scrapeable)

**Policy Risk Tracker**
- Per reform and per scheme: an explicit risk register, not just a health indicator
- Risks documented: budget cut risk, scheme restructuring risk, election/political change risk, implementation delay risk, global commodity price risk (for infra)
- Each risk rated: likelihood (Low/Medium/High) + impact on thesis (Moderate/Severe)
- Example: Green H₂ Mission — risk: electrolyser import dependency; risk: green H₂ price competitiveness timeline
- Updated from PIB/news pipeline signals automatically; Claude flags risk-related language in announcements
- Source: pipeline signals + Claude extraction on risk-related keywords

**Earnings Estimate vs. Actuals**
- Distinct from the Promises tracker: this tracks numerical financial guidance vs. actual quarterly results
- If management says "we expect ₹5000cr revenue in Q3" — did Q3 come in at ₹5000cr, above, or below?
- Tracks the beat/miss pattern over 8–12 quarters
- Companies that consistently beat guidance are conservative guiders (good). Companies that consistently miss are over-promisers (bad) or facing structural headwinds
- Shown as a bar chart: guidance bar vs. actual bar per quarter
- Source: concall transcripts (guidance extraction) + quarterly results PDFs (actuals)

**Forward P&L Estimation**
- When management gives numerical guidance (capacity, utilization rate, margin per unit, revenue targets), Claude computes the implied P&L scenario and stores it
- Example: Sambhv Steel management says "2M tons capacity by FY30, 60% utilisation, EBITDA ₹8000–9000/ton" → Claude computes: 2M × 60% × ₹8500 avg = ₹1020 Cr EBITDA → applies historical depreciation + interest to estimate PAT range → "If management delivers: FY30 EBITDA ₹800–1100 Cr, PAT ₹350–550 Cr"
- Stored alongside the ManagementPromise record as a `projectedScenario` JSON field
- Displayed on the company page as: "Bull case / Base case / Bear case" with the specific assumptions spelled out
- Critically — when the actual results arrive, the comparison is automatic: did reality match the projection management itself described?
- This is what separates a good analyst from someone who just reads the headline — BharatCapex does this computation automatically from the concall text
- Source: concall transcripts → Claude Sonnet extraction + computation

**Key Person Risk**
- Is the company a founder-led business? Is the founder still active in operations?
- Succession planning: is there a named successor, a professional management team, or is the company entirely dependent on one person?
- For Indian SME/mid-cap companies, founder health is an underappreciated risk
- Flag if: no professional CEO/CFO listed, founder >65 years old, no succession mentioned in annual report MD&A
- Source: annual report PDFs (MD&A + board composition) + news pipeline

**Export Orientation**
- % revenue from exports — tracked annually
- Trend matters: a company growing from 5% to 20% export revenue over 3 years has proven global competitiveness
- Particularly relevant for: defence (HAL export orders), electronics (Dixon, Kaynes), pharmaceuticals, chemicals
- A company winning export orders in a PLI sector means the PLI is working — the product is competitive globally, not just domestically protected
- Source: annual report PDFs (geographic segment breakdown)

**Dividend and Buyback History**
- 5-year history of: dividend per share, dividend payout ratio, buybacks (if any)
- A company that consistently pays dividends even in tough years is generating real cash (not just accounting profit)
- Buybacks are better than dividends in most cases — management is saying "we have no better use for this cash than returning it to shareholders"
- Neither is good if funded by debt — check D/E alongside
- Source: NSE corporate actions data (public, scrapeable)

---

### Data sources for Phase 3

| Feature | Source | Already in pipeline? |
|---|---|---|
| ROCE, D/E, revenue growth | Quarterly results PDFs | ❌ PDF pipeline needed |
| OCF vs PAT | Quarterly results PDFs | ❌ PDF pipeline needed |
| Order book trajectory | Quarterly results PDFs | ❌ PDF pipeline needed |
| Working capital trend | Quarterly results PDFs | ❌ PDF pipeline needed |
| Government receivables | Annual report PDFs | ❌ PDF pipeline needed |
| Capital allocation history | Annual report PDFs | ❌ PDF pipeline needed |
| Export orientation | Annual report PDFs (segment data) | ❌ PDF pipeline needed |
| Key person risk | Annual report PDFs (MD&A + board) | ❌ PDF pipeline needed |
| Earnings estimate vs actuals | Concall PDFs + quarterly results PDFs | ❌ PDF pipeline needed |
| Forward P&L estimation | Concall PDFs → Claude Sonnet (extract guidance + compute) | ❌ PDF pipeline needed |
| Concall sentiment | Concall PDFs → Claude Sonnet | ❌ PDF pipeline needed |
| Auditor qualifications | Annual report PDFs | ❌ PDF pipeline needed |
| Promise delivery rate | ManagementPromise table | ❌ PDF pipeline needed |
| Dividend / buyback history | NSE corporate actions scraper | ❌ New scraper needed |
| Promoter activity | NSE bulk/block deals scraper | ❌ New scraper needed |
| Promoter pledge % | NSE shareholding pattern scraper | ❌ New scraper needed |
| Institutional holding trends | NSE/BSE shareholding pattern scraper | ❌ New scraper needed |
| PE vs. history + peers | NSE price data scraper | ❌ New scraper needed |
| Company quality scorecard | Computed from above features | ❌ Requires all above |
| Sector cycle position | Computed from pipeline signals | ✅ Pipeline signals available |
| Thesis health indicator | Computed from pipeline signals | ✅ Pipeline signals available |
| Policy risk tracker | Pipeline signals + Claude extraction | ✅ Pipeline signals available |
| Supply chain map | Claude Sonnet extraction (new step) | ❌ New extraction step needed |

---

## 12. The Bigger Picture

Once the data pipeline is live and real investment utility is proven:

- **State-level tracker** — not just central govt, but state industrial policies (Gujarat, Maharashtra, Tamil Nadu are most active)
- **Email digest** — "This week in India capex" — weekly summary of biggest tenders, reform moves, company order wins
- **API** — let other tools (screeners, portfolio trackers) pull this data. B2B licensing may be faster revenue than B2C subscription.
- **Mobile app** — eventually, once the web product is proven
- **Monetisation** — freemium: basic data free, deep company intelligence + alerts behind a subscription (~₹999–2,999/month for a professional tier). SEBI Research Analyst registration may be required before formal monetisation.

---

_Next up: `/signals` page (surface 3,151 extracted signals) → Vercel deploy → verify Groq TPD fix → company discovery engine to populate structured tables. PDF pipeline + Management Promises is Phase 3._
