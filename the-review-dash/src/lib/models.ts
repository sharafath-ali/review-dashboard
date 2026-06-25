/**
 * Canonical review model used throughout the application.
 * All providers must normalize their responses into this shape.
 */
export interface Review {
  /** Stable, unique identifier from the upstream provider */
  reviewId: string;
  asin: string;
  productName: string;
  source: string;
  author: string;
  title: string | null;
  body: string | null;
  /** 1–5 */
  rating: number;
  /** ISO 8601 string or null if unavailable */
  reviewedAt: string | null;
  verified: boolean;
  helpfulCount: number;
}

/**
 * Result returned after an ingestion run for one ASIN.
 */
export interface IngestResult {
  asin: string;
  fetched: number;
  inserted: number;
  skipped: number;
  errors: string[];
}
