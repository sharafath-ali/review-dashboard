import axios, { AxiosError } from "axios";
import { IReviewProvider } from "./types";
import { Review } from "@/lib/models";
import { logger } from "@/lib/logger";
import { createHash } from "crypto";

// The /amazon/product endpoint returns customer_reviews along with product data
const BASE_URL = "https://api.scrapingdog.com/amazon/product";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

/** Raw shape of a review inside the Scrapingdog /amazon/product response */
interface ScrapingdogReview {
  customer_name?: string;
  customer_profile?: string;
  rating?: string;           // e.g. "5 out of 5 stars"
  review_title?: string;
  date?: string;             // e.g. "Reviewed in India on 5 June 2021"
  review_snippet?: string;
  verified_purchase?: boolean;
}

/** Top-level shape of the Scrapingdog /amazon/product response */
interface ScrapingdogProductResponse {
  customer_reviews?: ScrapingdogReview[];
  title?: string;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Parse "5 out of 5 stars" → 5, "3 out of 5 stars" → 3, etc.
 * Returns null if the string doesn't match the expected format.
 */
function parseRating(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/^(\d(?:\.\d)?)\s+out\s+of\s+5/i);
  if (!match) return null;
  const n = Math.round(parseFloat(match[1]));
  return n >= 1 && n <= 5 ? n : null;
}

/**
 * Parse "Reviewed in India on 5 June 2021" → ISO date string.
 * Returns null if parsing fails.
 */
function parseReviewDate(raw: string | undefined): string | null {
  if (!raw) return null;
  // Strip the "Reviewed in X on " prefix and parse what's left
  const match = raw.match(/on\s+(.+)$/i);
  if (!match) return null;
  const d = new Date(match[1].trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Clean up the review_snippet — Scrapingdog includes accessibility text:
 * "Brief content visible, double tap to read full content.Full content
 *  visible, double tap to read brief content.<ACTUAL REVIEW>Read moreRead less"
 */
function cleanSnippet(raw: string | undefined): string | null {
  if (!raw) return null;
  let text = raw;
  // Remove leading accessibility boilerplate
  const boilerplateEnd =
    "Full content visible, double tap to read brief content.";
  const idx = text.indexOf(boilerplateEnd);
  if (idx !== -1) {
    text = text.slice(idx + boilerplateEnd.length);
  }
  // Remove trailing "Read moreRead less" or "Read less" etc.
  text = text.replace(/Read\s*more\s*Read\s*less\s*$/i, "").trim();
  text = text.replace(/Read\s*less\s*$/i, "").trim();
  return text || null;
}

/**
 * Generate a stable review ID from available fields since the
 * product endpoint doesn't return a review_id field.
 * Uses SHA-1 of asin + customer_name + date + title — stable across re-fetches.
 */
function generateReviewId(
  asin: string,
  customerName: string,
  date: string,
  title: string
): string {
  return createHash("sha1")
    .update(`${asin}|${customerName}|${date}|${title}`)
    .digest("hex")
    .slice(0, 20);
}

/**
 * Normalize a raw Scrapingdog product review into our canonical Review model.
 * Every field is treated as potentially missing (defensive parsing).
 */
function normalize(
  raw: ScrapingdogReview,
  asin: string,
  productName: string
): Review | null {
  const rating = parseRating(raw.rating);
  if (rating === null) {
    logger.warn("Dropped review — could not parse rating", { asin, raw });
    return null;
  }

  const author = raw.customer_name?.trim() || "Anonymous";
  const title = raw.review_title?.trim() || null;
  const date = raw.date ?? "";
  const body = cleanSnippet(raw.review_snippet);
  const reviewedAt = parseReviewDate(date);

  // Build a stable ID since none is provided by the endpoint
  const reviewId = generateReviewId(asin, author, date, title ?? "");

  return {
    reviewId,
    asin,
    productName,
    source: "amazon_in",
    author,
    title,
    body,
    rating,
    reviewedAt,
    verified: raw.verified_purchase ?? false,
    helpfulCount: 0, // not returned by this endpoint
  };
}

export class ScrapingdogProvider implements IReviewProvider {
  readonly name = "scrapingdog";

  private readonly apiKey: string;
  private readonly domain: string;

  constructor() {
    const key = process.env.SCRAPINGDOG_API_KEY;
    if (!key) throw new Error("SCRAPINGDOG_API_KEY env var is not set");
    this.apiKey = key;
    this.domain = process.env.AMAZON_DOMAIN ?? "in";
  }

  async fetchReviews(asin: string, productName: string): Promise<Review[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info("Fetching from Scrapingdog /amazon/product", {
          asin,
          attempt,
          domain: this.domain,
        });

        const response = await axios.get<ScrapingdogProductResponse>(BASE_URL, {
          params: {
            api_key: this.apiKey,
            asin,
            country: this.domain,
            domain: this.domain,
          },
          timeout: 30_000,
        });

        const rawReviews: ScrapingdogReview[] =
          response.data?.customer_reviews ?? [];

        logger.info("Scrapingdog responded", {
          asin,
          rawCount: rawReviews.length,
        });

        const reviews: Review[] = [];
        for (const item of rawReviews) {
          const review = normalize(item, asin, productName);
          if (review) reviews.push(review);
        }

        return reviews;
      } catch (err) {
        const axiosErr = err as AxiosError;
        lastError = err as Error;

        const status = axiosErr.response?.status;

        // Don't retry on 4xx — bad API key, bad ASIN, etc.
        if (status && status >= 400 && status < 500) {
          logger.error("Non-retryable Scrapingdog error", {
            asin,
            status,
            message: lastError.message,
          });
          break;
        }

        logger.warn("Scrapingdog request failed, will retry", {
          asin,
          attempt,
          maxRetries: MAX_RETRIES,
          message: lastError.message,
        });

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    logger.error("All Scrapingdog retries exhausted", {
      asin,
      message: lastError?.message,
    });

    throw lastError ?? new Error(`Failed to fetch reviews for ${asin}`);
  }
}
