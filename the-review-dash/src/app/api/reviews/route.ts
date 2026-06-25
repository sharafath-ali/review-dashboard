import { NextResponse } from "next/server";
import { pool, ensureSchema } from "@/lib/db";
import { logger } from "@/lib/logger";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const rating = searchParams.get("rating");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const offset = (page - 1) * PAGE_SIZE;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (rating) {
      conditions.push(`rating = $${idx++}`);
      values.push(parseInt(rating, 10));
    }
    if (source) {
      conditions.push(`source = $${idx++}`);
      values.push(source);
    }
    if (search) {
      conditions.push(
        `(title ILIKE $${idx} OR body ILIKE $${idx} OR author ILIKE $${idx})`
      );
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count for pagination metadata
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reviews ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    values.push(PAGE_SIZE, offset);
    const dataResult = await pool.query(
      `SELECT
         id, review_id, asin, product_name, source, author, title, body,
         rating, reviewed_at, ingested_at, verified, helpful_count
       FROM reviews
       ${where}
       ORDER BY ingested_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    logger.info("GET /api/reviews", { total, page, returned: dataResult.rows.length });

    return NextResponse.json({
      reviews: dataResult.rows,
      meta: {
        total,
        page,
        pageSize: PAGE_SIZE,
        pages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("GET /api/reviews failed", { message: msg });
    return NextResponse.json(
      { error: "Failed to fetch reviews", detail: msg },
      { status: 500 }
    );
  }
}
