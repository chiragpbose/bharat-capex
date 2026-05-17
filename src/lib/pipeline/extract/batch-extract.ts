/**
 * Batch extraction via Anthropic Message Batches API.
 *
 * 50% cheaper than real-time calls (on top of prompt caching).
 * Use for backfills and large queues. The daily pipeline uses
 * the real-time extractor (extract-announcement.ts) for small runs.
 *
 * Flow:
 *   1. Fetch all pending rows from DB
 *   2. Submit one batch to Anthropic (up to 100k requests)
 *   3. Poll every 30s until processing_status === "ended"
 *   4. Stream results → write extractedData back to each row
 */

import Anthropic from "@anthropic-ai/sdk"
import { db } from "@/lib/db"
import { SYSTEM_PROMPT } from "./extract-announcement"

const client = new Anthropic()

type Extracted = {
  isRelevant:       boolean
  type:             string
  valueCrore:       number | null
  awardingBody:     string | null
  completionMonths: number | null
  summary:          string
}

export async function runBatchExtraction(limit = 99_999): Promise<number> {
  const pending = await db.rawAnnouncement.findMany({
    where:   { processedAt: null },
    take:    limit,
    orderBy: { publishedAt: "desc" },
    select:  { id: true, title: true, body: true },
  })

  if (pending.length === 0) {
    console.log("  Nothing pending.")
    return 0
  }

  console.log(`  Submitting ${pending.length.toLocaleString()} rows to Batches API…`)

  const requests = pending.map((row) => {
    const input = row.body ? `${row.title}\n\n${row.body}` : row.title
    return {
      custom_id: row.id,
      params: {
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system:     [{ type: "text" as const, text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } }],
        messages:   [{ role: "user" as const, content: input }],
      },
    }
  })

  const batch = await client.messages.batches.create({ requests })
  console.log(`  Batch ID : ${batch.id}`)
  console.log(`  Polling every 30s…`)

  // Poll until done
  let status = batch
  while (status.processing_status === "in_progress") {
    await new Promise((r) => setTimeout(r, 30_000))
    status = await client.messages.batches.retrieve(batch.id)
    const { succeeded, errored, expired, processing } = status.request_counts
    process.stdout.write(
      `\r  ✓ ${succeeded}  ✗ ${errored}  ⌛ ${expired}  ⟳ ${processing}   `
    )
  }
  console.log()

  // Stream results and write to DB
  let written = 0
  const resultStream = await client.messages.batches.results(batch.id)
  for await (const result of resultStream) {
    if (result.result.type !== "succeeded") continue

    const rawText =
      result.result.message.content[0].type === "text"
        ? result.result.message.content[0].text.trim()
        : ""
    const text = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim()

    let extracted: Extracted | { isRelevant: boolean; type: string; summary: string }
    try {
      extracted = JSON.parse(text) as Extracted
    } catch {
      extracted = { isRelevant: false, type: "PARSE_ERROR", summary: rawText.slice(0, 200) }
    }

    await db.rawAnnouncement.update({
      where: { id: result.custom_id },
      data:  { extractedData: extracted, processedAt: new Date() },
    })
    written++
    if (written % 500 === 0) process.stdout.write(`\r  Writing results: ${written}/${pending.length}`)
  }
  if (pending.length > 0) console.log(`\r  Writing results: ${written}/${pending.length}`)

  return written
}
