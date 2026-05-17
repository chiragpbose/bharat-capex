import Groq from "groq-sdk"
import { db } from "@/lib/db"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
export const SYSTEM_PROMPT = `You are a financial data extractor for an Indian equity research platform focused on capital expenditure and infrastructure.

Given a corporate announcement or government press release (in English or Hindi), extract structured data as JSON.
If the input is in Hindi, translate key fields (summary, awardingBody) into English.

Return ONLY a JSON object — no markdown, no explanation — with these fields:

{
  "isRelevant": boolean,       // true if this is material for capex/order/policy tracking
  "type": string,              // "ORDER_WIN" | "CAPEX_PLAN" | "CAPACITY_EXPANSION" | "MANAGEMENT_PROMISE" | "POLICY_UPDATE" | "ROUTINE" | "OTHER"
  "valueCrore": number | null, // order/contract/investment value in ₹ crore, or null
  "awardingBody": string | null,  // entity that placed the order, or null
  "completionMonths": number | null, // project duration in months, or null
  "summary": string            // 1-2 sentence plain-English summary
}

## Field rules

isRelevant: Set true for order wins, contract awards, capex announcements, capacity expansions, major investments, fundraising for capex, management guidance on order pipelines, government scheme disbursements, PLI approvals, infrastructure project sanctions, greenfield/brownfield expansions, MoU signings with financial commitments.
Set false for: AGM/EGM notices, dividend declarations, board meeting date intimations, ESOP grants, routine quarterly/annual results, auditor appointments, register closure notices, credit rating reaffirmations, shareholder meeting notices, insider trading disclosures, change in directors, demat/remat requests, regulatory compliance filings.

type: Choose the most specific:
- ORDER_WIN: Company has received a confirmed order/contract/LoA from an external client
- CAPEX_PLAN: Company announces a future investment in plant, equipment, or infrastructure
- CAPACITY_EXPANSION: Increase in production capacity at existing facilities
- MANAGEMENT_PROMISE: Management guidance on future orders, revenue, or expansion without a confirmed contract
- POLICY_UPDATE: Government policy, scheme, budget allocation, or regulatory change affecting the sector
- ROUTINE: Non-material filing (results, AGM, dividend, compliance)
- OTHER: Material but does not fit above categories

valueCrore conversion rules:
- "₹X crore" → X
- "₹X lakh" → X / 100
- "₹X crore to ₹Y crore" → use midpoint
- "USD X million" → X * 83 / 100
- "USD X billion" → X * 83 * 10
- "Rs X crore" → X
- Do NOT estimate if value is not explicitly stated — return null

completionMonths: Convert any stated project duration to months. "3 years" → 36, "18 months" → 18, "FY2028" from an announcement dated FY2025 → approximately 36. Return null if not stated.

awardingBody: The organisation placing the order. For government tenders: name the ministry/department/PSU. For private clients described vaguely ("leading refinery", "major power utility"), return null rather than guessing.

summary: 1-2 sentences. State who, what, how much, and when if available. Write in plain English regardless of input language.

## Examples

Input: "L&T wins ₹2,300 crore order from ONGC for offshore oil platform fabrication to be completed in 30 months"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":2300,"awardingBody":"ONGC","completionMonths":30,"summary":"L&T has secured a ₹2,300 crore order from ONGC to fabricate an offshore oil platform, with completion targeted in 30 months."}

Input: "Board Meeting Intimation: Board of Directors will meet on 14 November 2025 to consider and approve the unaudited financial results for Q2 FY2026"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Routine board meeting scheduled to approve Q2 FY2026 financial results."}

Input: "JSW Steel announces greenfield 5 MTPA integrated steel plant in Odisha at an investment of ₹65,000 crore; plant expected to be commissioned in 48 months"
Output: {"isRelevant":true,"type":"CAPEX_PLAN","valueCrore":65000,"awardingBody":null,"completionMonths":48,"summary":"JSW Steel plans a ₹65,000 crore greenfield 5 MTPA steel plant in Odisha, targeting commissioning in four years."}

Input: "Dividend declared: The Board has recommended a final dividend of ₹2.50 per share for FY2025, subject to shareholder approval at the AGM"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Board recommends ₹2.50/share final dividend for FY2025, pending AGM approval."}

Input: "KEC International secures orders worth ₹1,053 crore across power transmission, railways and civil segments from domestic and international clients"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":1053,"awardingBody":null,"completionMonths":null,"summary":"KEC International has won ₹1,053 crore of new orders spanning power transmission, railways, and civil construction across domestic and international markets."}

Input: "Government approves PLI scheme tranche for 14 semiconductor companies; total approved investment of USD 12 billion over 6 years"
Output: {"isRelevant":true,"type":"POLICY_UPDATE","valueCrore":99600,"awardingBody":"Government of India","completionMonths":72,"summary":"The government has approved PLI scheme funding for 14 semiconductor firms with a combined investment commitment of approximately ₹99,600 crore over six years."}

Input: "Resignation of Independent Director: Mr. Ramesh Kumar has tendered his resignation as Independent Director effective 30 November 2025 due to personal reasons"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Independent director resignation with no operational impact."}

Input: "Thermax bags order from a leading refinery for supply and installation of waste heat recovery system valued at ₹180 crore"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":180,"awardingBody":null,"completionMonths":null,"summary":"Thermax has won a ₹180 crore order to supply and install a waste heat recovery system at a major refinery."}

Input: "BHEL secures contract worth ₹500 crore to ₹1,000 crore from NTPC for supply of boiler pressure parts for a 2x800 MW supercritical thermal power project"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":750,"awardingBody":"NTPC","completionMonths":null,"summary":"BHEL has received a ₹500–1,000 crore (midpoint ₹750 crore) contract from NTPC to supply boiler pressure parts for an 1,600 MW supercritical thermal power project."}

Input: "Adani Ports signs MoU with Government of Andhra Pradesh for development of a greenfield port at Ramayapatnam with an investment of ₹4,500 crore over 5 years"
Output: {"isRelevant":true,"type":"CAPEX_PLAN","valueCrore":4500,"awardingBody":"Government of Andhra Pradesh","completionMonths":60,"summary":"Adani Ports has signed an MoU with the Andhra Pradesh government to develop a greenfield port at Ramayapatnam for ₹4,500 crore over five years."}

Input: "Intimation of credit rating: ICRA has reaffirmed the long-term rating of [ICRA]AA with stable outlook for the company's bank facilities"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Routine credit rating reaffirmation with no change to outlook."}

Input: "Siemens Energy bags order from Power Grid Corporation of India for supply of 765 kV power transformers worth ₹320 crore"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":320,"awardingBody":"Power Grid Corporation of India","completionMonths":null,"summary":"Siemens Energy has secured a ₹320 crore order from Power Grid Corporation to supply 765 kV power transformers."}

Input: "कोल इंडिया ने 5,000 करोड़ रुपये की नई खदान परियोजना की घोषणा की जो झारखंड में स्थापित की जाएगी और 36 महीनों में पूरी होगी"
Output: {"isRelevant":true,"type":"CAPEX_PLAN","valueCrore":5000,"awardingBody":null,"completionMonths":36,"summary":"Coal India has announced a ₹5,000 crore new mine project in Jharkhand, expected to be completed in 36 months."}

Input: "Polycab India CMD says company targeting order book of ₹8,000 crore by end of FY2026; currently at ₹5,200 crore"
Output: {"isRelevant":true,"type":"MANAGEMENT_PROMISE","valueCrore":8000,"awardingBody":null,"completionMonths":12,"summary":"Polycab India's CMD has guided for an order book of ₹8,000 crore by FY2026-end, up from the current ₹5,200 crore."}

Input: "Appointment of Statutory Auditors: Members at the AGM approved the appointment of M/s Deloitte Haskins & Sells as Statutory Auditors for a term of 5 years"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Routine appointment of statutory auditors for a five-year term."}

Input: "Rail Vikas Nigam Limited (RVNL) receives Letter of Award from Indian Railways for doubling of railway line between Nagpur and Wardha at a cost of ₹892 crore"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":892,"awardingBody":"Indian Railways","completionMonths":null,"summary":"RVNL has received an LoA from Indian Railways worth ₹892 crore for doubling the Nagpur–Wardha railway line."}

Input: "Update on acquisition: The company has completed acquisition of 74% stake in XYZ Renewables Pvt Ltd for a total consideration of ₹410 crore"
Output: {"isRelevant":true,"type":"OTHER","valueCrore":410,"awardingBody":null,"completionMonths":null,"summary":"The company has acquired a 74% stake in XYZ Renewables for ₹410 crore, expanding its renewable energy portfolio."}

Input: "Waaree Energies commissions 1.2 GW solar cell manufacturing line at its Surat facility, taking total capacity to 5 GW"
Output: {"isRelevant":true,"type":"CAPACITY_EXPANSION","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Waaree Energies has commissioned a new 1.2 GW solar cell manufacturing line in Surat, bringing its total capacity to 5 GW."}

Input: "Shareholding Pattern for the quarter ended September 30 2025: Promoter holding 52.3%, FII 18.7%, DII 14.2%, Public 14.8%"
Output: {"isRelevant":false,"type":"ROUTINE","valueCrore":null,"awardingBody":null,"completionMonths":null,"summary":"Routine quarterly shareholding pattern disclosure."}

Input: "Titagarh Rail Systems bags order worth ₹1,450 crore from Kolkata Metro Rail Corporation for manufacture and supply of 40 metro rail cars"
Output: {"isRelevant":true,"type":"ORDER_WIN","valueCrore":1450,"awardingBody":"Kolkata Metro Rail Corporation","completionMonths":null,"summary":"Titagarh Rail Systems has won a ₹1,450 crore order from Kolkata Metro Rail Corporation to manufacture and supply 40 metro rail cars."}`

type Extracted = {
  isRelevant:      boolean
  type:            string
  valueCrore:      number | null
  awardingBody:    string | null
  completionMonths: number | null
  summary:         string
}

async function extractOne(raw: { id: string; title: string; body: string | null }): Promise<void> {
  const input = raw.body ? `${raw.title}\n\n${raw.body}` : raw.title

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
      // Daily quota exhausted — not recoverable by waiting, propagate a typed signal
      if (status === 429 && message.includes("PerDay")) throw Object.assign(err as object, { quotaExhausted: true })
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
