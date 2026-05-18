# BharatCapex — Vision, Status & Roadmap

> Last updated: 2026-05-19 — project paused. This file is the primary context document for any future session or spinoff discussion.

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
| PDF extraction | OpenRouter + DeepSeek V3/V4 | Annual reports, concall transcripts — not yet built; ~20× cheaper than Claude Sonnet, 1M context |
| AI processing | Groq Llama 3.3 70B (free) | Extraction for announcements/news; ~83 rows/day on free tier |
| Job scheduling | GitHub Actions cron | `0 2 * * *` — 7:30 AM IST daily; manual trigger also available |
| Raw storage | `RawAnnouncement` table in Supabase | Stores title/body/source before AI extraction |

---

## 4. What's Been Built

### Pages

| Route               | Status                    | Notes                                                                                        |
| ------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `/`                 | ✅ UI complete            | Feed-first, sector chart, company movers — shows empty state (no data in structured tables)  |
| `/signals`          | ✅ Complete + data        | The ONLY page with real pipeline data — 3,151 extracted signals, filterable by type + source |
| `/reforms`          | ✅ UI complete            | Dropdown filters — shows empty state (structured Reform table has no rows)                   |
| `/reforms/[slug]`   | ✅ UI complete            | Journey tracker, money metrics — empty                                                       |
| `/companies`        | ✅ UI complete            | Sector filters — shows ~1 manually seeded company; otherwise empty                          |
| `/companies/[slug]` | ✅ UI complete            | Full dossier layout — empty                                                                  |
| `/tenders`          | ✅ UI complete            | Tender feed — empty (structured Tender table has no rows)                                    |
| `/schemes`          | ✅ UI complete            | Disbursement progress bars — empty                                                           |
| `/schemes/[slug]`   | ✅ UI complete            | Full scheme detail — empty                                                                   |
| `/promises`         | ❌ Not built              | Requires ManagementPromise table (PDF pipeline, Phase 3)                                     |
| `/calendar`         | ❌ Not built              | Requires structured event data                                                               |
| `/budget`           | ❌ Not built              | Budget allocations tracker                                                                   |

**Critical distinction:** "UI complete" means the page code exists and queries the DB correctly. It does NOT mean the page shows meaningful data. Only `/signals` has real data because it queries `RawAnnouncement.extractedData` directly. All other pages query structured tables (Company, Reform, Tender, Scheme) that are essentially empty.

### The data that actually exists (in RawAnnouncement)

```
Total rows:          15,764
Extracted relevant:   3,151
Date range:           ~May 2025 – May 2026
Sources breakdown:    NSE filings + PIB + ET/BS/Mint news + NITI Aayog + CPPP tenders
```

Each relevant signal has:
```json
{
  "isRelevant": true,
  "type": "ORDER_WIN",          // ORDER_WIN | CAPEX_PLAN | CAPACITY_EXPANSION |
                                 // MANAGEMENT_PROMISE | POLICY_UPDATE | OTHER
  "valueCrore": 2300,           // ₹ crore, or null
  "awardingBody": "ONGC",       // entity placing the order, or null
  "completionMonths": 30,       // project duration, or null
  "summary": "L&T has secured a ₹2,300 crore order from ONGC..."
}
```

### Design system

- Warm off-white background with subtle dot grid texture
- Classic blue-600 as primary accent; orange-500 for active nav state
- Each sector has its own hex colour used consistently across all pages
- Status colours: amber=proposed, sky=notified, emerald=implemented/operational, rose=stalled
- Financial figures always use `font-display` (Space Grotesk) + `tabular-nums`

---

## 5. Current Limitations (as of 2026-05-19 — project paused)

1. **Structured tables are empty** — The pipeline only writes to `RawAnnouncement`. Company, Reform, Tender, Scheme, and Sector tables have almost no data. The "company discovery engine" that would bridge these was never built. This is the central unfinished problem — the platform has 3,151 signals but the polished product UI can't show them.

2. **No Vercel deployment** — The app has never been deployed publicly. No live URL. Only runs on localhost.

3. **Daily extraction is rate-limited** — Groq free tier: 100k tokens/day. With current settings (~1,200 char body truncation), ~83 rows/day extractable. Daily new scraper output is ~100–130 rows, so a small backlog accumulates. Pipeline processes newest-first, so recent signals are always extracted.

4. **No PDF pipeline** — Annual reports and concall transcripts are the source for the Management Promises tracker and financial quality features. Not yet built.

5. **Company discovery is missing** — The platform cannot surface companies from reforms/tenders automatically. This is the core investment utility.

6. **No search, no auth, no personalisation** — Phase 4.

7. **~~CPPP awarded contracts~~** — Investigated and closed. NSE filings cover this better.

8. **~~Claude extraction not running~~** — Resolved: switched to Groq (free). Running daily.

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

## 7. What to Do When Resuming

### Already done (no longer pending)
- ~~Build `/signals` page~~ — Done. Filterable feed at `/signals`, added to nav.
- ~~Set up nightly cron~~ — Done. GitHub Actions `0 2 * * *`.
- ~~Activate extraction~~ — Done. Groq Llama 3.3 70B, free, running daily.
- ~~Investigate CPPP awarded contracts~~ — Closed. NSE covers it.
- ~~Fix Groq crash on quota~~ — Done. Graceful exit on TPD 429. Body truncated to 1,200 chars.

### Step 1: Deploy to Vercel
Connect GitHub repo → Vercel. Add env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`. Five minutes. No live URL exists yet.

### Step 2: Company discovery engine (Phase 2)
The most impactful next build. Bridges the pipeline and the UI.

- Download NSE company master CSV (free — symbol, name, sector, ~2,000 listed companies)
- Seed `Company` table from it (one-time script — NOT manual entry, it's automated from NSE data)
- For each NSE-origin `RawAnnouncement`, read the company ticker from the metadata already stored and link it to the `Company` record
- Result: Companies page shows real companies; each company page shows its order wins from the signals feed

Cost: zero. NSE ticker is already in the filing metadata. It's a lookup, not an AI problem.

The supply chain inference (second-order reasoning — who else benefits from this PLI announcement?) is Phase 2's ambitious feature and uses Groq. Scope it to high-value signals only (valueCrore > 500).

### Step 3: PDF pipeline for Management Promises (Phase 3)
- Use **OpenRouter + DeepSeek V3/V4** — NOT Anthropic directly. ~20× cheaper, 1M token context, OpenAI-compatible API. (Researched from actual docs 2026-05-17.)
- Test on one real Indian annual report PDF before any bulk run
- Downloads annual reports + concall transcripts from NSE filing attachments
- Extracts: management promises, guidance numbers, ROCE, order book trajectory, auditor qualifications
- Populates ManagementPromise table → powers /promises page

### Step 4: Remaining pages
`/promises`, `/calendar`, `/budget` — all require structured data to be non-trivial.

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

---

## 9. Post-Mortem — What Went Wrong and Why

This section is a candid account of every significant failure in the project. Written so that a future session — or a spinoff — doesn't repeat them.

---

### Failure 1: The $24 Anthropic Cost Disaster

**What happened:** The pipeline was built to use Claude Haiku 4.5 for extraction. Prompt caching was set up and claimed to give ~90% cost reduction. A 12-month historical backfill of 15,764 rows was run. The bill came to ~$24.

**What actually happened:** Prompt caching was silently ignored the entire time. Claude Haiku 4.5 requires a system prompt of at least 4,096 tokens before caching activates. Our system prompt was ~3,000 tokens. Anthropic does not warn you or throw an error — the API simply bills at full rate. The "cache_write" and "cache_read" token counts in the usage CSV were zero on every single row.

**The root cause:** The caching requirement was asserted from memory rather than verified against actual documentation. A $0 check — looking up "Haiku 4.5 prompt caching minimum tokens" in the Anthropic docs — would have caught this before the backfill ran.

**The consequence:** User ran out of API credit. Had to abandon Anthropic entirely and find a free alternative.

**The lesson:** Never claim a cost optimisation is working without empirically verifying it. For any bulk operation involving API costs, the sequence must be: (1) read actual docs, (2) run a 5-row test and check usage fields, (3) confirm savings, (4) then run at scale.

---

### Failure 2: The Gemini Detour

**What happened:** After the Anthropic disaster, the project needed a free extraction alternative. Gemini 2.5 Flash was proposed as the solution. Claims were made about its rate limits and capabilities without consulting actual documentation. The 20 RPD (requests per day) free tier limit was hit after 14 calls. The pipeline was down again.

**The root cause:** API capability claims were made from training data / memory rather than fetching the actual Gemini documentation. The user explicitly called this out: "Did you get all these facts from thin air or did you consult Gemini documentation?" The answer was yes, thin air. The limit was not 1,000 RPD as claimed — it was 20.

**The consequence:** Wasted time, eroded trust, one more failed pipeline run.

**The lesson:** Before any API integration decision, fetch the actual documentation. Do not make rate limit, pricing, or capability claims from memory. This is now a hard rule in CLAUDE.md.

---

### Failure 3: Multiple Groq Pipeline Crashes

**What happened:** The correct decision was made to switch to Groq (genuinely free, 1,000 RPD). But the pipeline kept crashing in multiple distinct ways:

**Crash A — TPD ceiling at row 28:** The system prompt was still ~3,000 tokens from the Anthropic version. Groq's free tier caps at 100,000 tokens/day. At ~3,500 tokens/call, this meant only 28 rows/day. The pipeline was hitting the ceiling and crashing every morning.

**Crash B — Wrong error string:** The graceful quota exit code checked for `message.includes("PerDay")`. Groq's actual error message says `"tokens per day (TPD)"`. The string mismatch meant the TPD error was never detected as a quota error. Instead of exiting cleanly, the code hit the 65-second retry branch (designed for per-minute limits), waited, tried again, failed again, and eventually threw an unhandled error. GitHub Actions showed exit code 1, not a clean quota message.

**Crash C — No body truncation:** Even after trimming the system prompt to 750 tokens, the body was sent in full. News articles were 2,000+ tokens of body text. Average call was ~2,800 tokens, not the ~1,350 expected. Still hitting the ceiling at row 35 instead of 74.

**The pattern:** Each fix was made reactively after a crash, rather than proactively calculating the expected token budget before deploying. Three separate crashes, each requiring a GitHub commit + push + wait for the next morning's cron to verify.

**The lesson:** Before deploying any rate-limited extraction job, calculate the token math explicitly: (system prompt tokens) + (average user message tokens) + (output tokens) = per-call cost. Then: daily limit ÷ per-call cost = daily row capacity. If capacity < expected daily volume, fix it before deploying.

---

### Failure 4: The Architectural Gap That Was Never Closed

**What happened:** The project built two things in parallel that were never connected:

1. A data pipeline that writes extracted signals to `RawAnnouncement.extractedData`
2. A polished product UI that reads from structured tables: `Company`, `Reform`, `Tender`, `Scheme`

The connection between them — the "company discovery engine" (Phase 2) — was perpetually deferred as a future milestone. Every session ended with "Phase 2 will populate the structured tables." Phase 2 was never started.

**The result:** After months of work, 15,764 rows of data, and ~$24 in API costs, the platform looked like this to a visitor: one company (BEL) listed under Semiconductors, empty reforms, empty tenders, empty schemes. The 3,151 relevant signals existed in the database but were completely invisible until the `/signals` page was built on the last day.

**Why it happened:** The structured tables were seeded with a handful of manually entered rows early in the project to test the UI. This made the UI look functional during development, which masked the growing disconnect. The pipeline work felt like progress. The UI looked complete. The gap was never felt as a blocker until a screenshot revealed "one company in the world."

**The lesson:** When building a pipeline-fed product, the UI and the pipeline must be connected from day one — even if the connection is simple. The `/signals` page (built last) should have been built first: it takes RawAnnouncement data directly and requires no intermediate structured tables. Start with the simplest possible data → UI connection, then build the structured layer on top.

---

### Failure 5: GitHub Actions Secrets Misconfiguration

**What happened:** The GitHub Actions workflow required three secrets: `DATABASE_URL`, `DIRECT_URL`, and `GROQ_API_KEY`. The user stored all three as `KEY=value` pairs inside a single secret named `BHARATCAPEX`. GitHub Actions secrets are single values — the workflow was reading an empty string for each variable. Multiple failed pipeline runs before the issue was diagnosed.

**The lesson:** When setting up GitHub Actions secrets, each secret is a single value, not a .env file. The secret name in GitHub must exactly match the `${{ secrets.NAME }}` reference in the workflow YAML.

---

### What Was Actually Built Well

It's worth recording what went right, not just what went wrong:

- **The 5 scrapers are solid** — NSE, PIB, ET/BS/Mint, NITI Aayog, CPPP all work reliably. The CAPTCHA bypass for CPPP (alt-text contains the answer) was clever. The PIB English PRID lookup was non-trivial to figure out. These are reusable.
- **The Groq extraction quality is good** — Llama 3.3 70B classifies signals accurately with only 5 examples in the prompt. ORDER_WIN, CAPEX_PLAN, MANAGEMENT_PROMISE, ROUTINE — the distinctions are being made correctly.
- **The data itself is valuable** — 3,151 structured capex signals from one year of Indian corporate and government activity. Each with date, source, type, value in crore, awarding body, and a plain-English summary. This is machine-readable, queryable, clean data that doesn't exist anywhere else in this form.
- **The schema is well-designed** — 13 models covering the full Reform → Scheme → Tender → Company → ManagementPromise chain. It can support the full product vision.
- **The frontend is complete** — 9 pages, a proper design system, the architecture is right. When the structured tables get populated, the UI is ready.
- **The pipeline runs every day for free** — GitHub Actions + Groq = zero ongoing cost for scraping and extraction.

---

_Project paused 2026-05-19. Pipeline continues running daily. 3,151 signals in DB. Next meaningful step: deploy to Vercel + build company discovery engine._
