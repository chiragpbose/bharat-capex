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
| AI processing | Claude Haiku 4.5 | Extraction for announcements/news; Sonnet for PDFs |
| Job scheduling | `tsx` + cron (TBD) | `npm run pipeline:run` for now; scheduling not yet set up |
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
│   ├── reforms/page.tsx                 Reforms listing — seed-data (to replace)
│   ├── reforms/[slug]/page.tsx          Reform detail — seed-data (to replace)
│   ├── companies/page.tsx               Companies listing — seed-data (to replace)
│   ├── companies/[slug]/page.tsx        Company detail — seed-data (to replace)
│   ├── tenders/page.tsx                 Tenders feed — seed-data (to replace)
│   ├── schemes/page.tsx                 Schemes listing — seed-data (to replace)
│   └── schemes/[slug]/page.tsx          Scheme detail — seed-data (to replace)
├── components/
│   ├── layout/nav.tsx                   Sticky nav
│   └── reforms/reform-filters.tsx       Client dropdown filters
├── lib/
│   ├── db.ts                            Prisma singleton — use this everywhere
│   ├── utils.ts                         cn() helper
│   ├── data/reforms.ts                  Data access layer (reforms only — rest to build)
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

1. **Most pages still use seed-data** — Homepage uses real DB queries, but reforms, companies, tenders, and schemes pages still import from the old hardcoded `seed-data.ts`. The data access layer (`src/lib/data/`) needs to be built out for these sections.
2. **Claude extraction not yet running** — The extraction layer is built and tested, but `ANTHROPIC_API_KEY` in `.env` is still a placeholder. Set the real key → run `npm run pipeline:run` → first real structured data in DB.
3. **No pipeline schedule** — The pipeline runs manually via `npm run pipeline:run`. No cron job or scheduled trigger yet. Needs to be set up to run nightly.
4. **CPPP awarded contracts missing** — The CPPP "Result of Tenders" endpoint (who won what) returns empty with current query parameters. Active high-value tenders work. Awarded contracts need investigation.
5. **No PDF pipeline** — Annual reports and concall transcripts are the source for the Management Promises tracker. Not yet built — this is Phase 3.
6. **Company discovery is missing** — The platform cannot yet surface companies from reforms/tenders automatically. This is the core investment utility and requires the full pipeline to be running first.
7. **No search** — Can't search across companies, reforms, or tenders. Phase 4.
8. **No auth** — No user accounts, no watchlists, no personalisation. Phase 4.

---

## 6. High-Level Roadmap

### Phase 1 — Real Data (IN PROGRESS — ~70% done)

Connect the database, build and activate the automated data pipeline.

**Pipeline architecture:**
```
Sources → Scrapers → RawAnnouncement table → Claude extraction → extractedData JSON → Frontend
```

**Done:** Supabase connected, schema live, 5 scrapers built (NSE, PIB, News, NITI Aayog, CPPP), Claude Haiku extraction layer built.

**Remaining:** Set Anthropic API key → run pipeline → verify extraction quality → connect all pages to real DB queries (replace seed-data.ts) → set up nightly cron schedule.

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

### Step 1: Activate Claude extraction ← next session

1. Add real `ANTHROPIC_API_KEY` to `.env` (console.anthropic.com, $5 minimum, lasts ~5 months)
2. Run `npm run pipeline:run`
3. Run `npx tsx src/lib/pipeline/check-data.ts` to verify extraction quality
4. Check `extractedData` JSON in Supabase — ensure `isRelevant`, `valueCrore`, `summary` fields look right

### Step 2: Connect all pages to real DB

Replace `seed-data.ts` imports across companies, tenders, and schemes pages. Build out the data access layer:

- `src/lib/data/companies.ts`
- `src/lib/data/tenders.ts`
- `src/lib/data/schemes.ts`
- `src/lib/data/sectors.ts`

`reforms.ts` already exists but is not fully wired. Once these are built, `seed-data.ts` can be deleted completely from remaining pages.

### Step 3: Set up nightly pipeline schedule

Run the pipeline automatically every night. Options:
- **Simplest:** GitHub Actions cron (free, triggers `npm run pipeline:run` on a schedule)
- **Later:** Supabase Edge Functions or a VPS cron

### Step 4: Investigate CPPP awarded contracts

The "Result of Tenders" section shows who won what — the awarded contract, not just the open tender. This is the direct order-win data for the Tenders section. Returns empty with current query; likely needs date parameters. Investigate the form POST structure.

### Step 5: PDF pipeline for Management Promises (Phase 3)

File: `src/lib/pipeline/sources/pdf-fetcher.ts`

- Downloads annual reports and concall transcripts attached to NSE/BSE filings
- Sends to Claude Sonnet (not Haiku — PDFs are complex multi-page documents) with a prompt to extract management promises
- Populates the `ManagementPromise` table — what was said, by whom, by when
- This powers the `/promises` page — the most differentiated feature on the platform

### Step 6: Build remaining UI pages

**Management Promises** `/promises` + section on `/companies/[slug]`
- Quote, speaker, source (concall / annual report / AGM), date, deadline, status
- No other tool tracks this automatically

**Policy Calendar** `/calendar`
- Forward-looking: PLI disbursement deadlines, budget dates, scheme windows, upcoming tenders
- Month/week view, filterable by sector

**Budget Tracker** `/budget`
- Union Budget allocations by sector, year-over-year comparison

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

**CPPP "Result of Tenders" (awarded contracts):** The awards section has stricter server-side validation — returns no records without specific date/org parameters that aren't obvious from the form HTML. Needs investigation. For now, high-value active tenders give a 3–6 month pipeline view (which tender → which company is likely to win → order inflow ahead). That's actually the higher-value leading indicator.

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

## 11. The Bigger Picture

Once the data pipeline is live and real investment utility is proven:

- **State-level tracker** — not just central govt, but state industrial policies (Gujarat, Maharashtra, Tamil Nadu are most active)
- **Email digest** — "This week in India capex" — weekly summary of biggest tenders, reform moves, company order wins
- **API** — let other tools (screeners, portfolio trackers) pull this data. B2B licensing may be faster revenue than B2C subscription.
- **Mobile app** — eventually, once the web product is proven
- **Monetisation** — freemium: basic data free, deep company intelligence + alerts behind a subscription (~₹999–2,999/month for a professional tier). SEBI Research Analyst registration may be required before formal monetisation.

---

_Next up: Connect real Anthropic API key → run pipeline → first real extractions. Then connect pages to DB (replace seed-data.ts). Then PDF pipeline for annual reports + Management Promises._
