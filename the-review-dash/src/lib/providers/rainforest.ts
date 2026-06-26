import axios, { AxiosError } from "axios";
import { IReviewProvider } from "./types";
import { Review } from "@/lib/models";
import { logger } from "@/lib/logger";

const BASE_URL = "https://api.rainforestapi.com/request";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

interface RainforestReview {
  id?: string;
  title?: string;
  body?: string;
  rating?: number;
  date?: {
    raw?: string;
    utc?: string;
  };
  profile?: {
    name?: string;
  };
  verified_purchase?: boolean;
  helpful_votes?: number;
}

interface RainforestResponse {
  reviews?: RainforestReview[];
  product?: {
    top_reviews?: RainforestReview[];
  };
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Parse date raw text like "Reviewed in Australia on 28 December 2023" to ISO string.
 */
function parseReviewDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/on\s+(.+)$/i);
  if (!match) return null;
  const d = new Date(match[1].trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Normalize a raw Rainforest review into our canonical Review model.
 */
function normalize(
  raw: RainforestReview,
  asin: string,
  productName: string,
): Review | null {
  const reviewId = raw.id?.trim();
  if (!reviewId) {
    logger.warn("Skipped review: missing canonical Amazon review ID (id)", {
      asin,
      raw,
    });
    return null;
  }

  const rating = raw.rating;
  if (
    rating === undefined ||
    rating === null ||
    isNaN(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    logger.warn("Skipped review: missing or invalid rating", {
      asin,
      reviewId,
      rating,
    });
    return null;
  }

  const author = raw.profile?.name?.trim() || "Anonymous";
  const title = raw.title?.trim() || null;
  const body = raw.body?.trim() || null;

  let reviewedAt: string | null = null;
  if (raw.date?.utc) {
    const d = new Date(raw.date.utc);
    if (!isNaN(d.getTime())) {
      reviewedAt = d.toISOString();
    }
  }
  if (!reviewedAt && raw.date?.raw) {
    reviewedAt = parseReviewDate(raw.date.raw);
  }

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
    helpfulCount: raw.helpful_votes ?? 0,
  };
}

export class RainforestProvider implements IReviewProvider {
  readonly name = "rainforest";

  private readonly apiKey: string;

  constructor() {
    const key = process.env.RAINFOREST_API_KEY;
    if (!key) {
      throw new Error("RAINFOREST_API_KEY env var is not set");
    }
    this.apiKey = key;
  }

  async fetchReviews(asin: string, productName: string): Promise<Review[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info("Fetching from Rainforest API", {
          asin,
          attempt,
        });

        const response = await axios.get<RainforestResponse>(BASE_URL, {
          params: {
            api_key: this.apiKey,
            amazon_domain: "amazon.in",
            asin,
            type: "product",
          },
          timeout: 30_000,
        });

        const rawReviews: RainforestReview[] =
          response.data?.product?.top_reviews ?? response.data?.reviews ?? [];

        logger.info("Rainforest API responded", {
          asin,
          rawCount: rawReviews.length,
        });

        const reviews: Review[] = [];
        for (const item of rawReviews) {
          const review = normalize(item, asin, productName);
          if (review) {
            reviews.push(review);
          }
        }

        return reviews;
      } catch (err) {
        const axiosErr = err as AxiosError;
        lastError = err as Error;

        const status = axiosErr.response?.status;
        if (status && status >= 400 && status < 500) {
          logger.error("Non-retryable Rainforest API error", {
            asin,
            status,
            message: lastError.message,
          });
          break;
        }

        logger.warn("Rainforest API request failed, will retry", {
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

    logger.error("All Rainforest API retries exhausted", {
      asin,
      message: lastError?.message,
    });

    throw lastError ?? new Error(`Failed to fetch reviews for ${asin}`);
  }
}
