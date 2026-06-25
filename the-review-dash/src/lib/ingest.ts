import { pool } from "@/lib/db";
import { IReviewProvider } from "@/lib/providers/types";
import { Review, IngestResult } from "@/lib/models";
import { logger } from "@/lib/logger";

/** Products to ingest — add/remove products here without touching other layers */
export const PRODUCTS: { asin: string; name: string }[] = [
  { asin: "B07RQW6SD5", name: "KardiaMobile 6L" },
  { asin: "B01A4W8AUK", name: "KardiaMobile 1-Lead" },
  { asin: "B09TQ3ZN8V", name: "KardiaMobile Card" },
];

/**
 * Upsert a single review into the database.
 * ON CONFLICT DO NOTHING means running ingestion twice is idempotent.
 */
async function upsertReview(review: Review): Promise<"inserted" | "skipped"> {
  const result = await pool.query(
    `INSERT INTO reviews
       (review_id, asin, product_name, source, author, title, body,
        rating, reviewed_at, verified, helpful_count)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (review_id) DO NOTHING`,
    [
      review.reviewId,
      review.asin,
      review.productName,
      review.source,
      review.author,
      review.title,
      review.body,
      review.rating,
      review.reviewedAt,
      review.verified,
      review.helpfulCount,
    ]
  );
  return result.rowCount && result.rowCount > 0 ? "inserted" : "skipped";
}

/**
 * Fetch reviews for one ASIN and upsert them into the database.
 */
async function ingestOne(
  provider: IReviewProvider,
  asin: string,
  productName: string
): Promise<IngestResult> {
  const result: IngestResult = {
    asin,
    fetched: 0,
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const reviews: Review[] = await provider.fetchReviews(asin, productName);
    result.fetched = reviews.length;

    for (const review of reviews) {
      try {
        const outcome = await upsertReview(review);
        if (outcome === "inserted") result.inserted++;
        else result.skipped++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`upsert error for ${review.reviewId}: ${msg}`);
        logger.error("Failed to upsert review", {
          reviewId: review.reviewId,
          message: msg,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`fetch error: ${msg}`);
    logger.error("Failed to fetch reviews", { asin, message: msg });
  }

  logger.info("Ingest complete for ASIN", {
    asin,
    fetched: result.fetched,
    inserted: result.inserted,
    skipped: result.skipped,
    errors: result.errors.length,
  });

  return result;
}

/**
 * Run a full ingestion across all configured products.
 * Products are fetched sequentially to avoid hammering the upstream API.
 */
export async function runFullIngest(
  provider: IReviewProvider
): Promise<IngestResult[]> {


  const results: IngestResult[] = [];
  for (const product of PRODUCTS) {
    const r = await ingestOne(provider, product.asin, product.name);
    results.push(r);
  }
  return results;
}
