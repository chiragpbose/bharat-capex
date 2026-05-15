import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

// Use DIRECT_URL for the seed — it's a long-running process, not serverless.
// The session pooler (port 5432) handles persistent connections correctly.
const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const SECTORS = [
  { name: "Defence & Aerospace",     slug: "defence",           color: "#1d4ed8", companiesCount: 34, govtOutlayCrore: 185000, orderBookCrore: 380000 },
  { name: "Railways",                slug: "railways",          color: "#7c3aed", companiesCount: 18, govtOutlayCrore: 252000, orderBookCrore: 290000 },
  { name: "Roads & Highways",        slug: "roads",             color: "#b45309", companiesCount: 41, govtOutlayCrore: 270000, orderBookCrore: 420000 },
  { name: "Energy & Power",          slug: "energy",            color: "#047857", companiesCount: 28, govtOutlayCrore: 320000, orderBookCrore: 540000 },
  { name: "Semiconductors",          slug: "semiconductors",    color: "#be123c", companiesCount: 9,  govtOutlayCrore: 76000,  orderBookCrore: 18000  },
  { name: "Heavy Engineering",       slug: "heavy-engineering", color: "#0369a1", companiesCount: 22, govtOutlayCrore: 95000,  orderBookCrore: 195000 },
  { name: "Shipping & Ports",        slug: "shipping",          color: "#0f766e", companiesCount: 15, govtOutlayCrore: 88000,  orderBookCrore: 52000  },
  { name: "Nuclear",                 slug: "nuclear",           color: "#6d28d9", companiesCount: 7,  govtOutlayCrore: 200000, orderBookCrore: 42000  },
  { name: "Chemicals & Fertilizers", slug: "chemicals",         color: "#b45309", companiesCount: 31, govtOutlayCrore: 72000,  orderBookCrore: 38000  },
  { name: "Data Centres & AI Infra", slug: "data-centres",      color: "#0c4a6e", companiesCount: 12, govtOutlayCrore: 25000,  orderBookCrore: 68000  },
]

const SCHEMES = [
  {
    name: "PLI – Semiconductors & Display",
    slug: "pli-semiconductors",
    shortName: "PLI Semicon",
    description: "Production Linked Incentive scheme to build a domestic semiconductor manufacturing ecosystem from scratch. Covers greenfield fabs, OSAT/ATMP facilities, compound semiconductors, and display fabs. Incentive of 50% on capital expenditure for approved projects.",
    ministry: "MeitY",
    status: "ACTIVE" as const,
    color: "#be123c",
    highlight: "India's first semiconductor fab under construction at Dholera, Gujarat",
    sectorSlugs: ["semiconductors"],
    budgetOutlayCrore: 76000,
    disbursedCrore: 3200,
    totalInvestmentCrore: 148000,
    approvedProjects: 4,
    jobsTargeted: 180000,
    schemeStartYear: 2021,
    schemeEndYear: 2031,
    beneficiaryTickers: ["CGPOWER"],
    keyBeneficiaries: ["Tata Electronics (Fab)", "Micron India (OSAT)", "CG Power (OSAT)", "Kaynes Semicon"],
  },
  {
    name: "PM Gati Shakti – NIP",
    slug: "pm-gati-shakti",
    shortName: "Gati Shakti",
    description: "National Master Plan integrating 16 ministries on a unified platform for multi-modal infrastructure planning. Backed by ₹100L cr National Infrastructure Pipeline covering roads, railways, ports, airports, and logistics parks through 2030.",
    ministry: "MoCI / MoF",
    status: "ACTIVE" as const,
    color: "#b45309",
    highlight: "Logistics cost target: reduce from 14% to 8% of GDP by 2030",
    sectorSlugs: ["roads", "railways", "shipping"],
    budgetOutlayCrore: 1000000,
    disbursedCrore: 420000,
    totalInvestmentCrore: 1000000,
    approvedProjects: 6800,
    jobsTargeted: null,
    schemeStartYear: 2021,
    schemeEndYear: 2030,
    beneficiaryTickers: ["LT", "RVNL", "KNRCON"],
    keyBeneficiaries: ["L&T", "RVNL", "KNR Constructions", "PNC Infratech", "GR Infraprojects"],
  },
  {
    name: "PLI – Defence Manufacturing",
    slug: "pli-defence",
    shortName: "PLI Defence",
    description: "Production Linked Incentive scheme to reduce import dependence and build a ₹1.75L cr domestic defence industry by 2025. Two separate buckets: domestic defence manufacturers and export promotion.",
    ministry: "Ministry of Defence",
    status: "ACTIVE" as const,
    color: "#1d4ed8",
    highlight: "Defence export target: ₹35,000 cr by FY25 — already at ₹21,000 cr",
    sectorSlugs: ["defence"],
    budgetOutlayCrore: 18920,
    disbursedCrore: 4100,
    totalInvestmentCrore: 35000,
    approvedProjects: 28,
    jobsTargeted: 50000,
    schemeStartYear: 2021,
    schemeEndYear: 2028,
    beneficiaryTickers: ["BEL", "LT", "COCHINSHIP"],
    keyBeneficiaries: ["BEL", "L&T Defence", "Cochin Shipyard", "HAL", "BEML"],
  },
  {
    name: "PLI – Solar PV Modules",
    slug: "pli-solar",
    shortName: "PLI Solar",
    description: "Incentivise domestic manufacturing of high-efficiency solar PV modules to reduce import dependence on China. Target of 65 GW annual manufacturing capacity.",
    ministry: "MNRE",
    status: "ACTIVE" as const,
    color: "#047857",
    highlight: "India now 3rd largest solar market globally; 80% module import substitution target",
    sectorSlugs: ["energy"],
    budgetOutlayCrore: 19500,
    disbursedCrore: 2800,
    totalInvestmentCrore: 94000,
    approvedProjects: 11,
    jobsTargeted: 195000,
    schemeStartYear: 2021,
    schemeEndYear: 2028,
    beneficiaryTickers: ["NTPC"],
    keyBeneficiaries: ["Adani Solar", "Tata Power Solar", "Waaree Energies", "Premier Energies"],
  },
  {
    name: "Sagarmala Programme",
    slug: "sagarmala",
    shortName: "Sagarmala",
    description: "Port-led development programme to modernise India's 7,500 km coastline. Covers port modernisation, port connectivity, port-led industrialisation, and coastal community development.",
    ministry: "MoPSW",
    status: "ACTIVE" as const,
    color: "#0f766e",
    highlight: "839 projects worth ₹5.48L cr — 469 projects completed",
    sectorSlugs: ["shipping"],
    budgetOutlayCrore: 548000,
    disbursedCrore: 168000,
    totalInvestmentCrore: 548000,
    approvedProjects: 839,
    jobsTargeted: 1000000,
    schemeStartYear: 2016,
    schemeEndYear: 2035,
    beneficiaryTickers: ["COCHINSHIP"],
    keyBeneficiaries: ["Cochin Shipyard", "Adani Ports", "JSW Infra", "Mazagon Dock"],
  },
  {
    name: "National Green Hydrogen Mission",
    slug: "green-hydrogen-mission",
    shortName: "Green H₂",
    description: "Make India a global hub for production, usage, and export of green hydrogen. Target of 5 MMT annual production by 2030 with ₹8L cr total investment expected.",
    ministry: "MNRE",
    status: "ACTIVE" as const,
    color: "#047857",
    highlight: "5 MMT/year target = 10% of global green H₂ demand; ₹8L cr investment opportunity",
    sectorSlugs: ["energy", "chemicals"],
    budgetOutlayCrore: 19744,
    disbursedCrore: 480,
    totalInvestmentCrore: 800000,
    approvedProjects: 8,
    jobsTargeted: 600000,
    schemeStartYear: 2023,
    schemeEndYear: 2030,
    beneficiaryTickers: ["NTPC"],
    keyBeneficiaries: ["NTPC Green", "Adani New Industries", "Reliance New Energy", "ACME Solar"],
  },
  {
    name: "PLI – Telecom & Networking",
    slug: "pli-telecom",
    shortName: "PLI Telecom",
    description: "Incentivise domestic manufacturing of telecom and networking products to support 5G rollout and reduce import bill. Covers core transmission, access, CPE, and IoT equipment.",
    ministry: "DoT",
    status: "ACTIVE" as const,
    color: "#0c4a6e",
    highlight: "India's telecom equipment exports up 5x since scheme launch",
    sectorSlugs: ["data-centres", "semiconductors"],
    budgetOutlayCrore: 12195,
    disbursedCrore: 1850,
    totalInvestmentCrore: 4000,
    approvedProjects: 31,
    jobsTargeted: 40000,
    schemeStartYear: 2021,
    schemeEndYear: 2027,
    beneficiaryTickers: [],
    keyBeneficiaries: ["Dixon Technologies", "Tejas Networks", "HFCL", "Sterlite Tech"],
  },
]

const REFORMS = [
  {
    title: "Defence FDI limit raised to 100% via automatic route",
    slug: "defence-fdi-100-percent",
    summary: "Government raises FDI cap in defence manufacturing to 100% through automatic route, removing Cabinet Committee on Security approval for most categories.",
    status: "IMPLEMENTED" as const,
    difficulty: "HIGH" as const,
    sectorSlug: "defence",
    schemeSlug: null,
    notifiedAt: new Date("2020-09-01"),
    sourceUrl: "https://dipp.gov.in",
    budgetOutlayCrore: null,
    fdiCommittedCrore: 28400,
    marketOpportunityCrore: 500000,
    note: "Unlocked ₹5L cr+ domestic defence market to private capital",
  },
  {
    title: "PLI scheme for semiconductors and display manufacturing",
    slug: "pli-semiconductors",
    summary: "₹76,000 crore incentive scheme to attract global chip manufacturers and build domestic semiconductor ecosystem. Covers fabs, OSATs, and compound semiconductors.",
    status: "OPERATIONAL" as const,
    difficulty: "HIGH" as const,
    sectorSlug: "semiconductors",
    schemeSlug: "pli-semiconductors",
    notifiedAt: new Date("2021-12-21"),
    sourceUrl: "https://meity.gov.in",
    budgetOutlayCrore: 76000,
    fdiCommittedCrore: 148000,
    marketOpportunityCrore: 630000,
    note: "Micron, Tata Electronics, CG Power approved; first fab under construction",
  },
  {
    title: "PM Gati Shakti National Master Plan operationalised",
    slug: "pm-gati-shakti",
    summary: "Unified logistics and infra planning platform integrating 16 ministries. Enables integrated multi-modal connectivity planning across roads, railways, ports, and airways.",
    status: "IMPLEMENTED" as const,
    difficulty: "MEDIUM" as const,
    sectorSlug: "roads",
    schemeSlug: "pm-gati-shakti",
    notifiedAt: new Date("2021-10-13"),
    sourceUrl: "https://pmgatishakti.gov.in",
    budgetOutlayCrore: 1000000,
    fdiCommittedCrore: null,
    marketOpportunityCrore: null,
    note: "₹100L cr NIP projects tracked; logistics cost target reduced from 14% to 8% of GDP",
  },
  {
    title: "Private sector participation in nuclear energy permitted",
    slug: "nuclear-private-sector",
    summary: "Government amends Atomic Energy Act to allow private sector joint ventures in nuclear power plant construction and operation. First such reform since 1962.",
    status: "NOTIFIED" as const,
    difficulty: "HIGH" as const,
    sectorSlug: "nuclear",
    schemeSlug: null,
    notifiedAt: new Date("2024-07-23"),
    sourceUrl: "https://dae.gov.in",
    budgetOutlayCrore: 200000,
    fdiCommittedCrore: null,
    marketOpportunityCrore: 800000,
    note: "100 GW nuclear target by 2047; ₹8L cr investment opportunity",
  },
  {
    title: "Dedicated Freight Corridor full operationalisation",
    slug: "dfc-operationalisation",
    summary: "Eastern and Western Dedicated Freight Corridors fully commissioned, reducing freight transit time by 40%. Frees up passenger lines and cuts logistics costs for industry.",
    status: "IMPLEMENTED" as const,
    difficulty: "MEDIUM" as const,
    sectorSlug: "railways",
    schemeSlug: "pm-gati-shakti",
    notifiedAt: new Date("2024-03-01"),
    sourceUrl: "https://dfccil.com",
    budgetOutlayCrore: 102000,
    fdiCommittedCrore: null,
    marketOpportunityCrore: null,
    note: "₹1.02L cr total project cost; logistics savings estimated at ₹18,000 cr/yr",
  },
  {
    title: "Ship recycling capacity expansion under Hong Kong Convention",
    slug: "ship-recycling-expansion",
    summary: "India ratifies Hong Kong Convention and targets 50% of global ship recycling capacity by 2030. Alang Shipbreaking Yard modernisation underway.",
    status: "PROPOSED" as const,
    difficulty: "LOW" as const,
    sectorSlug: "shipping",
    schemeSlug: null,
    notifiedAt: null,
    sourceUrl: null,
    budgetOutlayCrore: 8000,
    fdiCommittedCrore: null,
    marketOpportunityCrore: 45000,
    note: "India currently has 30% global share; target 50% by 2030",
  },
]

const COMPANIES = [
  {
    name: "Larsen & Toubro",
    slug: "larsen-toubro",
    tickerNse: "LT",
    sectorSlugs: ["heavy-engineering", "defence", "roads"],
    description: "India's largest engineering conglomerate with presence across EPC, defence, IT, and financial services.",
    orderBookCrore: 490000,
    recentWin: "₹14,000 cr NHAI expressway package",
    roce: 14.2,
    revenueCrore: 221113,
    marketCapCrore: 348000,
    capexPlannedCrore: 12000,
    revenueGrowthPct: 17.4,
    patCrore: 15404,
    debtEquityRatio: 1.8,
  },
  {
    name: "Bharat Electronics",
    slug: "bharat-electronics",
    tickerNse: "BEL",
    sectorSlugs: ["defence", "semiconductors"],
    description: "State-owned defence electronics manufacturer. Dominant in radar, communication, and electronic warfare systems.",
    orderBookCrore: 72000,
    recentWin: "₹5,400 cr QRSAM production contract",
    roce: 28.1,
    revenueCrore: 19699,
    marketCapCrore: 198000,
    capexPlannedCrore: 3500,
    revenueGrowthPct: 14.8,
    patCrore: 3491,
    debtEquityRatio: 0.02,
  },
  {
    name: "Rail Vikas Nigam",
    slug: "rvnl",
    tickerNse: "RVNL",
    sectorSlugs: ["railways"],
    description: "Special purpose vehicle for fast-tracking rail infrastructure projects. Executes doubling, electrification, new lines, and gauge conversion.",
    orderBookCrore: 85000,
    recentWin: "₹1,200 cr Mumbai Metro corridor work",
    roce: 19.4,
    revenueCrore: 21313,
    marketCapCrore: 72000,
    capexPlannedCrore: null,
    revenueGrowthPct: 9.3,
    patCrore: 1477,
    debtEquityRatio: 0.12,
  },
  {
    name: "KNR Constructions",
    slug: "knr-constructions",
    tickerNse: "KNRCON",
    sectorSlugs: ["roads"],
    description: "Mid-cap EPC contractor focused on highways, irrigation, and urban infrastructure. Known for execution quality and lean balance sheet.",
    orderBookCrore: 11000,
    recentWin: "₹2,800 cr NHAI 4-lane highway in Rajasthan",
    roce: 22.7,
    revenueCrore: 5412,
    marketCapCrore: 9800,
    capexPlannedCrore: 800,
    revenueGrowthPct: 12.1,
    patCrore: 621,
    debtEquityRatio: 0.38,
  },
  {
    name: "Cochin Shipyard",
    slug: "cochin-shipyard",
    tickerNse: "COCHINSHIP",
    sectorSlugs: ["shipping", "defence"],
    description: "India's largest public sector shipbuilder. Building India's first indigenous aircraft carrier INS Vikrant. Growing ship repair and green shipping capabilities.",
    orderBookCrore: 22000,
    recentWin: "₹4,900 cr contract for 6 next-gen patrol vessels",
    roce: 17.8,
    revenueCrore: 3847,
    marketCapCrore: 24000,
    capexPlannedCrore: 2400,
    revenueGrowthPct: 31.2,
    patCrore: 726,
    debtEquityRatio: 0.0,
  },
  {
    name: "NTPC",
    slug: "ntpc",
    tickerNse: "NTPC",
    sectorSlugs: ["energy", "nuclear"],
    description: "India's largest power generator. Aggressive expansion into renewable energy, pumped hydro, and nuclear. Target of 60GW renewable by 2032.",
    orderBookCrore: 320000,
    recentWin: "₹23,000 cr 1,320 MW Singrauli thermal expansion",
    roce: 11.2,
    revenueCrore: 177032,
    marketCapCrore: 326000,
    capexPlannedCrore: 30000,
    revenueGrowthPct: 8.6,
    patCrore: 17106,
    debtEquityRatio: 1.4,
  },
]

const TENDERS = [
  {
    slug: "nhai-amritsar-bathinda-expressway-pkg3",
    title: "NHAI — 6-lane Greenfield expressway, Amritsar–Bathinda (Package 3)",
    awardingBody: "NHAI",
    valueCrore: 4200,
    awardedAt: new Date("2025-03-18"),
    completionMonths: 36,
    companySlug: "larsen-toubro",
    sectorSlug: "roads",
    schemeSlug: "pm-gati-shakti",
    status: "AWARDED" as const,
  },
  {
    slug: "mod-qrsam-production-bel",
    title: "MoD — Quick Reaction Surface-to-Air Missile (QRSAM) production",
    awardingBody: "Ministry of Defence",
    valueCrore: 5413,
    awardedAt: new Date("2025-02-07"),
    completionMonths: 60,
    companySlug: "bharat-electronics",
    sectorSlug: "defence",
    schemeSlug: "pli-defence",
    status: "AWARDED" as const,
  },
  {
    slug: "railways-vande-bharat-120-rakes",
    title: "Indian Railways — Vande Bharat trainset manufacturing (120 rakes)",
    awardingBody: "Indian Railways / RDSO",
    valueCrore: 8950,
    awardedAt: new Date("2025-01-22"),
    completionMonths: 48,
    companySlug: "rvnl",
    sectorSlug: "railways",
    schemeSlug: "pm-gati-shakti",
    status: "AWARDED" as const,
  },
  {
    slug: "mod-ins-vikrant-class-carrier-2",
    title: "Ministry of Ports — INS Vikrant class carrier (second hull) design",
    awardingBody: "Ministry of Defence / Navy",
    valueCrore: 6800,
    awardedAt: new Date("2024-12-11"),
    completionMonths: 84,
    companySlug: "cochin-shipyard",
    sectorSlug: "shipping",
    schemeSlug: null,
    status: "AWARDED" as const,
  },
  {
    slug: "ntpc-floating-solar-ramagundam",
    title: "NTPC — 500 MW Floating Solar, Ramagundam reservoir",
    awardingBody: "NTPC",
    valueCrore: 2100,
    awardedAt: new Date("2024-11-30"),
    completionMonths: 24,
    companySlug: "knr-constructions",
    sectorSlug: "energy",
    schemeSlug: null,
    status: "AWARDED" as const,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding database…")

  // 1. Sectors — no dependencies
  const sectorRecords = await Promise.all(
    SECTORS.map((s) =>
      prisma.sector.upsert({
        where: { slug: s.slug },
        update: { govtOutlayCrore: s.govtOutlayCrore, orderBookCrore: s.orderBookCrore, color: s.color, companiesCount: s.companiesCount },
        create: { name: s.name, slug: s.slug, color: s.color, govtOutlayCrore: s.govtOutlayCrore, orderBookCrore: s.orderBookCrore, companiesCount: s.companiesCount },
      })
    )
  )
  const bySlug = Object.fromEntries(sectorRecords.map((s) => [s.slug, s]))
  console.log(`  ✓ ${sectorRecords.length} sectors`)

  // 2. Schemes — depend on sectors (via Schemesector junction)
  const schemeRecords = await Promise.all(
    SCHEMES.map((sc) =>
      prisma.scheme.upsert({
        where: { slug: sc.slug },
        update: {},
        create: {
          name: sc.name,
          shortName: sc.shortName,
          slug: sc.slug,
          status: sc.status,
          description: sc.description,
          ministry: sc.ministry,
          color: sc.color,
          highlight: sc.highlight,
          budgetOutlayCrore: sc.budgetOutlayCrore,
          disbursedCrore: sc.disbursedCrore,
          totalInvestmentCrore: sc.totalInvestmentCrore,
          approvedProjects: sc.approvedProjects,
          jobsTargeted: sc.jobsTargeted,
          schemeStartYear: sc.schemeStartYear,
          schemeEndYear: sc.schemeEndYear,
          keyBeneficiaries: sc.keyBeneficiaries,
          sectors: {
            create: sc.sectorSlugs.map((slug) => ({
              sector: { connect: { id: bySlug[slug].id } },
            })),
          },
        },
      })
    )
  )
  const schemeBySlug = Object.fromEntries(schemeRecords.map((s) => [s.slug, s]))
  console.log(`  ✓ ${schemeRecords.length} schemes`)

  // 3. Reforms — depend on sectors + optionally schemes
  const reformRecords = await Promise.all(
    REFORMS.map((r) =>
      prisma.reform.upsert({
        where: { slug: r.slug },
        update: {},
        create: {
          title: r.title,
          slug: r.slug,
          summary: r.summary,
          status: r.status,
          difficulty: r.difficulty,
          note: r.note,
          budgetOutlayCrore: r.budgetOutlayCrore,
          fdiCommittedCrore: r.fdiCommittedCrore,
          marketOpportunityCrore: r.marketOpportunityCrore,
          notifiedAt: r.notifiedAt,
          sourceUrl: r.sourceUrl,
          sector: { connect: { id: bySlug[r.sectorSlug].id } },
          ...(r.schemeSlug ? { scheme: { connect: { slug: r.schemeSlug } } } : {}),
        },
      })
    )
  )
  console.log(`  ✓ ${reformRecords.length} reforms`)

  // 4. Companies — depend on sectors (via CompanySector junction)
  const companyRecords = await Promise.all(
    COMPANIES.map((co) =>
      prisma.company.upsert({
        where: { slug: co.slug },
        update: {},
        create: {
          name: co.name,
          slug: co.slug,
          tickerNse: co.tickerNse,
          description: co.description,
          orderBookCrore: co.orderBookCrore,
          recentWin: co.recentWin,
          roce: co.roce,
          revenueCrore: co.revenueCrore,
          marketCapCrore: co.marketCapCrore,
          capexPlannedCrore: co.capexPlannedCrore,
          revenueGrowthPct: co.revenueGrowthPct,
          patCrore: co.patCrore,
          debtEquityRatio: co.debtEquityRatio,
          sectors: {
            create: co.sectorSlugs.map((slug) => ({
              sector: { connect: { id: bySlug[slug].id } },
            })),
          },
        },
      })
    )
  )
  const companyBySlug = Object.fromEntries(companyRecords.map((c) => [c.slug, c]))
  const companyByTicker = Object.fromEntries(
    companyRecords.filter((c) => c.tickerNse).map((c) => [c.tickerNse!, c])
  )
  console.log(`  ✓ ${companyRecords.length} companies`)

  // 5. Company–Scheme beneficiary links
  let schemeLinks = 0
  for (const sc of SCHEMES) {
    const scheme = schemeBySlug[sc.slug]
    for (const ticker of sc.beneficiaryTickers) {
      const company = companyByTicker[ticker]
      if (!company) continue
      await prisma.companyScheme.upsert({
        where: { companyId_schemeId: { companyId: company.id, schemeId: scheme.id } },
        update: {},
        create: { companyId: company.id, schemeId: scheme.id },
      })
      schemeLinks++
    }
  }
  console.log(`  ✓ ${schemeLinks} company–scheme links`)

  // 6. Tenders — depend on companies + sectors + optionally schemes
  const tenderRecords = await Promise.all(
    TENDERS.map((t) =>
      prisma.tender.upsert({
        where: { slug: t.slug },
        update: {},
        create: {
          slug: t.slug,
          title: t.title,
          awardingBody: t.awardingBody,
          valueCrore: t.valueCrore,
          awardedAt: t.awardedAt,
          completionMonths: t.completionMonths,
          status: t.status,
          company: { connect: { slug: t.companySlug } },
          sector: { connect: { id: bySlug[t.sectorSlug].id } },
        },
      })
    )
  )
  console.log(`  ✓ ${tenderRecords.length} tenders`)

  // 7. Tender–Scheme links
  let tenderSchemeLinks = 0
  for (const t of TENDERS) {
    if (!t.schemeSlug) continue
    const tender = tenderRecords.find((r) => r.slug === t.slug)!
    const scheme = schemeBySlug[t.schemeSlug]
    if (!scheme) continue
    await prisma.tenderScheme.upsert({
      where: { tenderId_schemeId: { tenderId: tender.id, schemeId: scheme.id } },
      update: {},
      create: { tenderId: tender.id, schemeId: scheme.id },
    })
    tenderSchemeLinks++
  }
  console.log(`  ✓ ${tenderSchemeLinks} tender–scheme links`)

  console.log("\nSeed complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => pool.end())
