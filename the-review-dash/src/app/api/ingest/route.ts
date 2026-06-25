import { NextResponse } from "next/server";
import { ScrapingdogProvider } from "@/lib/providers/scrapingdog";
import { runFullIngest } from "@/lib/ingest";
import { logger } from "@/lib/logger";

/**
 * POST /api/ingest
 * Triggers a full review fetch from Scrapingdog and stores results in the DB.
 * Protected by a simple bearer token (INGEST_SECRET) to prevent abuse.
 */
export async function POST(request: Request) {
  // Simple auth guard
  const secret = process.env.INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  logger.info("POST /api/ingest — starting ingestion run");

  try {
    const provider = new ScrapingdogProvider();
    const results = await runFullIngest(provider);

    const summary = {
      totalFetched: results.reduce((s, r) => s + r.fetched, 0),
      totalInserted: results.reduce((s, r) => s + r.inserted, 0),
      totalSkipped: results.reduce((s, r) => s + r.skipped, 0),
      totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
      perAsin: results,
    };

    logger.info("POST /api/ingest — complete", summary);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("POST /api/ingest — failed", { message: msg });
    return NextResponse.json(
      { error: "Ingestion failed", detail: msg },
      { status: 500 },
    );
  }
}
