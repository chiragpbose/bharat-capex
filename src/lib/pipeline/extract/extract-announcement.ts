import Groq from "groq-sdk"
import { db } from "@/lib/db"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
export const SYSTEM_PROMPT = `You are a financial data extractor for an Indian equity research platform focused on capital expenditure and infrastructure.

Given a corporate announcement or government press release (in English or Hindi), extract structured data as JSON.
If the input is in Hindi, translate key fields (summary, awardingBody) into English.

Return ONLY a JSON object — no markdown, no explanation — with these fields:

{
  "isRelevant": boolean,
  "type": string,              // "ORDER_WIN" | "CAPEX_PLAN" | "CAPACITY_EXPANSION" | "MANAGEMENT_PROMISE" | "POLICY_UPDATE" | "ROUTINE" | "OTHER"
  "valueCrore": number | null,
  "awardingBody": string | null,
  "completionMonths": number | null,
  "summary": string
}

## Field rules

isRelevant: true for order wins, capex announcements, capacity expansions, PLI approvals, infrastructure sanctions, greenfield/brownfield expansions, MoU signings with financial commitments, government scheme disbursements, management guidance on order pipelines.
false for: AGM/EGM notices, dividend declarations, board meeting intimations, ESOP grants, quarterly/annual results, auditor appointments, register closure, credit rating reaffirmations, shareholder meeting notices, insider trading disclosures, director changes, compliance filings.

type:
- ORDER_WIN: confirmed order/contract/LoA received from external client
- CAPEX_PLAN: announced future investment in plant, equipment, or infrastructure
- CAPACITY_EXPANSION: increase in production capacity at existing facilities
- MANAGEMENT_PROMISE: management guidance on future orders/revenue without a confirmed contract
- POLICY_UPDATE: government policy, scheme, budget allocation, or regulatory change
- ROUTINE: non-material filing (results, AGM, dividend, compliance)
- OTHER: material but does not fit above

valueCrore: "₹X crore"→X, "₹X lakh"→X/100, "₹X cr to ₹Y cr"→midpoint, "USD X million"→X*83/100, "USD X billion"→X*83*10. Return null if not stated.
completionMonths: convert to months ("3 years"→36, "FY2028 from FY2025"→36). Null if not stated.
awardingBody: organisation placing the order. Null for vague descriptions ("leading refinery", "major utility").
summary: 1-2 sentences — who, what, how much, when. Plain English regardless of input language.

## Examples

Input: "BHEL secures contract worth ₹500 crore to ₹1,000 crore from NTPC for supply of boiler pressure parts for a 2x800 MW supercritical thermal power project"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":750,"awardingBody":"NTPC","completionMonths":null,"summary":"BHEL has received a ₹500–1,000 crore (midpoint ₹750 crore) contract from NTPC to supply boiler pressure parts for a 1,600 MW supercritical thermal power project."}

Input: "Dividend declared: The Board has recommended a final dividend of ₹2.50 per share for FY2025, subject to shareholder approval at the AGM"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Board recommends ₹2.50/share final dividend for FY2025, pending AGM approval."}

Input: "JSW Steel announces greenfield 5 MTPA integrated steel plant in Odisha at an investment of ₹65,000 crore; plant expected to be commissioned in 48 months"
Output: {"isRelevant":true,"type":"CAPEX_PLAN","valueCrore":65000,"awardingBody":null,"completionMonths":48,"summary":"JSW Steel plans a ₹65,000 crore greenfield 5 MTPA steel plant in Odisha, targeting commissioning in four years."}

Input: "Polycab India CMD says company targeting order book of ₹8,000 crore by end of FY2026; currently at ₹5,200 crore"
Output: {"isRelevant":true,"type":"MANAGEMENT_PROMISE","valueCrore":8000,"awardingBody":null,"completionMonths":12,"summary":"Polycab India's CMD has guided for an order book of ₹8,000 crore by FY2026-end, up from the current ₹5,200 crore."}

Input: "कोल इंडिया ने 5,000 करोड़ रुपये की नई खदान परियोजना की घोषणा की जो झारखंड में स्थापित की जाएगी और 36 महीनों में पूरी होगी"
Output: {"isRelevant":true,"type":"CAPEX_PLAN","valueCrore":5000,"awardingBody":null,"completionMonths":36,"summary":"Coal India has announced a ₹5,000 crore new mine project in Jharkhand, expected to be completed in 36 months."}`

type Extracted = {
  isRelevant:      boolean
  type:            string
  valueCrore:      number | null
  awardingBody:    string | null
  completionMonths: number | null
  summary:         string
}

const BODY_CHAR_LIMIT = 1_200

function isDailyQuotaError(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes("per day") || lower.includes("tpd") || lower.includes("tokens per day")
}

async function extractOne(raw: { id: string; title: string; body: string | null }): Promise<void> {
  const body  = raw.body ? raw.body.slice(0, BODY_CHAR_LIMIT) : null
  const input = body ? `${raw.title}\n\n${body}` : raw.title

  let text = ""
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await groq.chat.completions.create({
        model:           "llama-3.3-70b-versatile",
        messages:        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: input },
        ],
        response_format: { type: "json_object" },
        max_tokens:      1024,
      })
      text = response.choices[0]?.message?.content ?? ""
      break
    } catch (err: unknown) {
      const status  = (err as { status?: number }).status
      const message = (err as { message?: string }).message ?? ""
      // Daily quota exhausted — not recoverable by retrying, propagate a typed signal
      if (status === 429 && isDailyQuotaError(message)) throw Object.assign(err as object, { quotaExhausted: true })
      if (attempt < 3) {
        if (status === 429) {
          await new Promise(r => setTimeout(r, 65_000))
          continue
        }
        if (status === 503 || status === 529) {
          await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt)))
          continue
        }
      }
      throw err
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let extracted: any
  try {
    extracted = JSON.parse(text) as Extracted
  } catch {
    extracted = { isRelevant: false, type: "PARSE_ERROR", summary: text.slice(0, 200) }
  }

  await db.rawAnnouncement.update({
    where: { id: raw.id },
    data:  { extractedData: extracted, processedAt: new Date() },
  })
}

export async function processPendingAnnouncements(limit = 50): Promise<number> {
  const pending = await db.rawAnnouncement.findMany({
    where:   { processedAt: null },
    take:    limit,
    orderBy: { publishedAt: "desc" },
    select:  { id: true, title: true, body: true },
  })

  let done = 0
  const total = pending.length

  for (const row of pending) {
    try {
      await extractOne(row)
    } catch (err: unknown) {
      if ((err as { quotaExhausted?: boolean }).quotaExhausted) {
        console.log(`\n  Daily quota exhausted after ${done} extractions — resuming tomorrow`)
        return done
      }
      throw err
    }
    done++
    process.stdout.write(`\r  Extracting: ${done}/${total}`)
    if (done < total) await new Promise(r => setTimeout(r, 4_000))
  }
  if (total > 0) console.log()

  return total
}
