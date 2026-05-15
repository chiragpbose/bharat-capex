import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"

const client = new Anthropic()

// Cached system prompt — Anthropic automatically caches prompts > 1024 tokens
// when you pass cache_control. Saves ~90% on repeated calls.
const SYSTEM_PROMPT = `You are a financial data extractor for an Indian equity research platform focused on capital expenditure and infrastructure.

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

Conversion rules for valueCrore:
- "₹X crore" → X
- "₹X lakh" → X / 100
- "₹X crore to ₹Y crore" → midpoint
- "USD X million" → X * 83 / 100  (approx ₹ crore)
- "USD X billion" → X * 83 * 10
- Only fill if value is explicitly stated — do NOT estimate

Set isRelevant: false for: AGM/EGM notices, dividend declarations, board meeting dates, ESOP grants, routine compliance filings, auditor appointments, register closure notices.
Set isRelevant: true for: order wins, contract awards, capex announcements, capacity expansions, major investments, fundraising for capex, management guidance on orders.`

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

  const msg = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: "user", content: input }],
  })

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : ""

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

  // Sequential to avoid hammering the API — Haiku is fast enough
  for (const ann of pending) {
    await extractOne(ann)
  }

  return pending.length
}
