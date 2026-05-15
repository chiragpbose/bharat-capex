/**
 * CPPP (Central Public Procurement Portal) high-value tender scraper.
 *
 * Fetches large open tenders from eprocure.gov.in/cppp — Works (≥₹100cr),
 * Goods (≥₹50cr), Services (≥₹1cr) — as published by all central govt bodies.
 *
 * Why high-value tenders (not just awarded)?
 *   Open tenders are a 3–6 month leading indicator of order inflows.
 *   When NHAI floats a ₹1500cr highway project, EPC companies like L&T, KNR,
 *   Dilip Buildcon are likely to bid. The awarded result follows later.
 *   This is the "order pipeline" view — earlier signal than waiting for awards.
 *
 * CAPTCHA bypass:
 *   CPPP uses an image CAPTCHA but includes the answer in the img alt attribute
 *   (accessibility anti-pattern). We extract it from the HTML — no Playwright
 *   needed. Subsequent pagination pages load without any CAPTCHA.
 */

import { db } from "@/lib/db"

const CPPP_BASE = "https://eprocure.gov.in/cppp"
const HV_PAGE   = `${CPPP_BASE}/highvaluetenders`
const HV_POST   = `${CPPP_BASE}/highvaluetenders/cpppdata`

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
  "Accept": "text/html,application/xhtml+xml",
}

type CpppTender = {
  tenderId:     string
  title:        string
  organisation: string
  publishedAt:  Date
  tenderUrl:    string | null
  category:     string
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function parseCpppDate(raw: string): Date {
  // Format: "14-May-2026 05:00 PM"
  try {
    const d = new Date(raw.trim())
    if (!isNaN(d.getTime())) return d
  } catch { /* fall through */ }
  return new Date()
}

function parseTenderTable(html: string, category: string): CpppTender[] {
  const results: CpppTender[] = []
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i)
  if (!tbodyMatch) return results

  for (const rowMatch of tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
    if (cells.length < 5) continue

    // Column layout: SN | Published | BidClose | BidOpen | Title+TenderID | Organisation
    const publishedRaw = stripHtml(cells[1]?.[1] ?? "")
    const titleCell    = cells[4]?.[1] ?? ""
    const orgCell      = stripHtml(cells[5]?.[1] ?? "")

    // Link from the title cell
    const urlMatch    = titleCell.match(/href="([^"]+)"/)
    const tenderUrl   = urlMatch?.[1] ?? null

    // Text from anchor + trailing ID (separated by first "/" after closing </a>)
    const fullText    = stripHtml(titleCell)
    // Last slash-delimited segment is the Tender Reference No
    const segments    = fullText.split("/")
    const tenderId    = segments.pop()?.trim() ?? ""
    const title       = segments.join("/").trim() || fullText

    if (!title || !tenderId) continue

    results.push({
      tenderId,
      title: title.slice(0, 500),
      organisation: orgCell.slice(0, 200),
      publishedAt:  parseCpppDate(publishedRaw),
      tenderUrl,
      category,
    })
  }
  return results
}

async function fetchWithCaptchaBypass(
  category: "Works" | "Services" | "Goods",
  maxPages = 3
): Promise<CpppTender[]> {
  // Step 1: fetch the form page and extract CAPTCHA fields + answer
  const pageRes = await fetch(HV_PAGE, { headers: HEADERS, cache: "no-store" })
  const pageHtml = await pageRes.text()

  const buildId       = pageHtml.match(/name="form_build_id" value="([^"]+)"/)?.[1]
  const captchaSid    = pageHtml.match(/name="captcha_sid" value="([^"]+)"/)?.[1]
  const captchaToken  = pageHtml.match(/name="captcha_token" value="([^"]+)"/)?.[1]
  // The image CAPTCHA answer is in the alt attribute — accessibility anti-pattern
  const captchaAnswer = pageHtml.match(/image-captcha-generate[^"]*"[^>]*alt="([^"]+)"/)?.[1]

  if (!buildId || !captchaSid || !captchaToken || !captchaAnswer) {
    console.warn("CPPP: could not extract CAPTCHA fields — site structure may have changed")
    return []
  }

  // Step 2: POST the search form with the solved CAPTCHA
  const formBody = new URLSearchParams({
    s_state:          "select",
    s_prod_type:      category,
    s_keyword:        "",
    s_short:          "published_date",
    captcha_response: captchaAnswer,
    captcha_sid:      captchaSid,
    captcha_token:    captchaToken,
    form_build_id:    buildId,
    form_id:          "highvaluetenders_form",
    op:               "Search",
  })

  const postRes = await fetch(HV_POST, {
    method:  "POST",
    headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded", "Referer": HV_PAGE },
    body:    formBody.toString(),
    cache:   "no-store",
  })

  const postHtml = await postRes.text()

  // Step 3: extract the session URL from the first pagination link
  // Format: href=https://eprocure.gov.in/cppp/highvaluetenders/cpppdata/BASE64SESSION?page=2
  const sessionUrl = postHtml.match(
    /href=(https:\/\/eprocure\.gov\.in\/cppp\/highvaluetenders\/cpppdata\/[A-Za-z0-9+/=_-]+)/
  )?.[1]

  const tenders = parseTenderTable(postHtml, category)

  if (!sessionUrl) return tenders

  // Step 4: fetch subsequent pages (no CAPTCHA on paginated pages)
  for (let page = 2; page <= maxPages; page++) {
    try {
      const pageUrl  = `${sessionUrl}?page=${page}`
      const pRes     = await fetch(pageUrl, { headers: HEADERS })
      const pHtml    = await pRes.text()
      const rows     = parseTenderTable(pHtml, category)
      if (rows.length === 0) break
      tenders.push(...rows)
    } catch {
      break
    }
  }

  return tenders
}

export async function syncCpppTenders(): Promise<{ fetched: number; saved: number }> {
  const categories: Array<"Works" | "Services" | "Goods"> = ["Works", "Services", "Goods"]
  let fetched = 0
  let saved   = 0

  for (const category of categories) {
    let tenders: CpppTender[] = []
    try {
      tenders = await fetchWithCaptchaBypass(category, 3)
      fetched += tenders.length
    } catch (err) {
      console.error(`CPPP ${category} fetch failed:`, err)
      continue
    }

    for (const t of tenders) {
      const titleWithOrg = `[${t.organisation}] ${t.title}`

      try {
        await db.rawAnnouncement.upsert({
          where:  { source_externalId: { source: "CPPP", externalId: t.tenderId } },
          create: {
            source:        "CPPP",
            externalId:    t.tenderId,
            title:         titleWithOrg.slice(0, 500),
            body:          `Category: ${category}\nOrganisation: ${t.organisation}`,
            attachmentUrl: t.tenderUrl ?? null,
            publishedAt:   t.publishedAt,
          },
          update: {},
        })
        saved++
      } catch {
        // Duplicate — safe to ignore
      }
    }
  }

  return { fetched, saved }
}
