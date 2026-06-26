import { NextResponse } from "next/server";
import { RainforestProvider } from "@/lib/providers/rainforest";
import { runFullIngest } from "@/lib/ingest";
import { logger } from "@/lib/logger";
import { verifyAuth } from "@/lib/auth";

/**
 * POST /api/ingest
 * Triggers a full review fetch from Rainforest API and stores results in the DB.
 * Protected by a simple bearer token (INGEST_SECRET) to prevent abuse.
 */
export async function POST(request: Request) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  logger.info("POST /api/ingest — starting ingestion run");

  try {
    const provider = new RainforestProvider();
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
