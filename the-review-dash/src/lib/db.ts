import { Pool } from "pg";

// Reuse a single connection pool across requests (important in serverless/dev)
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool: Pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

/**
 * Ensures the reviews table exists. Call once at startup / on first ingest.
 */
export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id            SERIAL PRIMARY KEY,
      review_id     TEXT        NOT NULL UNIQUE,   -- stable upstream ID
      asin          TEXT        NOT NULL,
      product_name  TEXT        NOT NULL,
      source        TEXT        NOT NULL DEFAULT 'amazon_in',
      author        TEXT        NOT NULL,
      title         TEXT,
      body          TEXT,
      rating        SMALLINT    NOT NULL,
      reviewed_at   TIMESTAMPTZ,
      ingested_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified      BOOLEAN     NOT NULL DEFAULT FALSE,
      helpful_count INTEGER     NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_ingested_at ON reviews (ingested_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reviews_asin        ON reviews (asin);
  `);
}
